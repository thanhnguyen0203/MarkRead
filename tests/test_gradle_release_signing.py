"""Opt-in integration check: reject invalid release identity without changing a built APK.

Uses existing local JDK/SDK/Gradle cache; no keys or application artifacts are generated.
"""
from pathlib import Path
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    output = ROOT / 'build/ui-p4c/after'
    output.mkdir(parents=True, exist_ok=True)
    apk = ROOT / 'app/build/outputs/apk/release/app-release.apk'
    before = hashlib.sha256(apk.read_bytes()).hexdigest()
    missing = ROOT / 'build/ui-p4c/signing-guard-missing.p12'
    if missing.exists():
        raise RuntimeError('Negative-test path unexpectedly exists; do not overwrite it.')
    env = os.environ.copy()
    env['JAVA_HOME'] = str(next((ROOT / 'toolchain/jdk').glob('jdk-17*')))
    env['ANDROID_HOME'] = str(ROOT / 'toolchain/android-sdk')
    env['ANDROID_SDK_ROOT'] = env['ANDROID_HOME']
    env['ANDROID_USER_HOME'] = str(ROOT / 'build/android-build-gate/android-user')
    env['GRADLE_USER_HOME'] = str(ROOT / '.gradle/user-home')
    rows = []
    for name, override in [('missing-store', {'MARKREAD_RELEASE_STORE_FILE': str(missing)}), ('wrong-alias', {'MARKREAD_RELEASE_KEY_ALIAS': '__markread_qa_missing_alias__'})]:
        current = {**env, **override}
        result = subprocess.run([str(ROOT / 'gradlew.bat'), '--offline', '--no-daemon', '--console=plain', ':app:verifyReleaseSigning'], cwd=ROOT, env=current, capture_output=True, text=True)
        text = result.stdout + result.stderr
        (output / ('signing-' + name + '.txt')).write_text(text, encoding='utf-8')
        unchanged = hashlib.sha256(apk.read_bytes()).hexdigest() == before
        assert result.returncode != 0 and 'SIGNING BLOCKED' in text and unchanged, name
        rows.append({'case': name, 'status': 'PASS', 'invalidIdentityRejected': True, 'builtApkUnchanged': unchanged})
        print('PASS release signing rejects ' + name, flush=True)
    (output / 'signing-negative.json').write_text(json.dumps({'pass': len(rows), 'fail': 0, 'cases': rows}, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
