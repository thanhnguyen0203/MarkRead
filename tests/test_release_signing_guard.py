"""The legacy builder must never create signing identities or mutate outputs when keys are missing."""
from pathlib import Path
import importlib.util
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
loader = importlib.util.spec_from_file_location('legacy_apk_builder', ROOT / 'build_apk.py')
builder = importlib.util.module_from_spec(loader)
loader.loader.exec_module(builder)


class SigningGuardTest(unittest.TestCase):
    def setUp(self):
        parent = ROOT / 'build/ui-p4b/guard-tests'
        parent.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=parent)
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.private = self.folder / 'private'

    def assert_blocked_without_work(self):
        with patch.object(builder, 'PRIVATE', self.private), patch.object(builder, 'run') as run:
            with self.assertRaisesRegex(SystemExit, 'SIGNING BLOCKED'):
                builder.build()
            run.assert_not_called()

    def test_missing_directory_never_created(self):
        self.assert_blocked_without_work()
        self.assertFalse(self.private.exists())

    def test_missing_key_never_generates_or_changes_password(self):
        self.private.mkdir()
        password = self.private / 'keystore-password.txt'
        password.write_text('fixture-only-not-a-real-password')
        before = password.read_bytes()
        self.assert_blocked_without_work()
        self.assertFalse((self.private / 'markread-release.p12').exists())
        self.assertEqual(before, password.read_bytes())

    def test_missing_password_keeps_key_bytes(self):
        self.private.mkdir()
        key = self.private / 'markread-release.p12'
        key.write_bytes(b'fixture-not-a-keystore')
        self.assert_blocked_without_work()
        self.assertEqual(key.read_bytes(), b'fixture-not-a-keystore')

    def test_empty_password_blocks_before_compilation(self):
        self.private.mkdir()
        (self.private / 'markread-release.p12').write_bytes(b'fixture-not-a-keystore')
        (self.private / 'keystore-password.txt').write_text(' \n')
        self.assert_blocked_without_work()

    def test_existing_material_only_returned_no_signing_or_key_generation(self):
        self.private.mkdir()
        key = self.private / 'markread-release.p12'
        password = self.private / 'keystore-password.txt'
        key.write_bytes(b'fixture-not-a-keystore')
        password.write_text('fixture-only-not-a-real-password')
        with patch.object(builder, 'PRIVATE', self.private), patch.object(builder, 'run') as run:
            self.assertEqual(builder.existing_signing_material(), (key, password))
            run.assert_not_called()
        self.assertEqual(key.read_bytes(), b'fixture-not-a-keystore')
        self.assertEqual(password.read_text(), 'fixture-only-not-a-real-password')


if __name__ == '__main__':
    unittest.main(testRunner=unittest.TextTestRunner(stream=sys.stdout, verbosity=2))
