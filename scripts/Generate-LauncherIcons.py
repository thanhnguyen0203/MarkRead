"""Generate original MarkRead vector artwork and Android XML, offline/std library.

Source: design/launcher/markread/concepts.json. --check never writes resources.
Legacy PNGs and preview sheets: scripts/Render-LauncherIcons.cjs (existing Playwright).
"""
from pathlib import Path
import argparse
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'design/launcher/markread'
RES = ROOT / 'app/src/main/res'
NS = 'http://schemas.android.com/apk/res/android'


def outputs():
    spec = json.loads((ART / 'concepts.json').read_text(encoding='utf-8'))
    result = {}
    selected = next(c for c in spec['concepts'] if c['id'] == spec['selected'])
    for concept in spec['concepts']:
        for variant in ['color', 'monochrome', 'foreground']:
            color = '#000000' if variant == 'monochrome' else spec['accent']
            bg = f'<path fill="{spec["background"]}" d="M0 0H108V108H0Z"/>' if variant == 'color' else ''
            paths = ''.join(f'<path fill="{color}" fill-rule="evenodd" d="{p}"/>' for p in concept['paths'])
            result[ART / f'{concept["id"]}-{variant}.svg'] = (
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">'
                f'<title>MarkRead — {concept["name"]} ({variant})</title>{bg}{paths}</svg>\n')
    for name, color in [('ic_foreground', spec['accent']), ('ic_monochrome', '#000000')]:
        paths = '\n'.join(f'    <path android:fillColor="{color}" android:fillType="evenOdd" android:pathData="{p}" />' for p in selected['paths'])
        result[RES / f'drawable/{name}.xml'] = (
            '<?xml version="1.0" encoding="utf-8"?>\n'
            f'<vector xmlns:android="{NS}" android:width="108dp" android:height="108dp" '
            f'android:viewportWidth="108" android:viewportHeight="108">\n{paths}\n</vector>\n')
    result[RES / 'drawable/ic_background.xml'] = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        f'<shape xmlns:android="{NS}" android:shape="rectangle">\n'
        f'    <solid android:color="{spec["background"]}" />\n</shape>\n')
    for version in [26, 33]:
        mono = '    <monochrome android:drawable="@drawable/ic_monochrome" />\n' if version == 33 else ''
        xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
               f'<adaptive-icon xmlns:android="{NS}">\n'
               '    <background android:drawable="@drawable/ic_background" />\n'
               '    <foreground android:drawable="@drawable/ic_foreground" />\n'
               f'{mono}</adaptive-icon>\n')
        for name in ['ic_launcher', 'ic_launcher_round']:
            result[RES / f'mipmap-anydpi-v{version}/{name}.xml'] = xml
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    failed = []
    for path, text in outputs().items():
        ET.fromstring(text)
        expected = text.encode('utf-8')
        if args.check:
            if not path.exists() or path.read_bytes() != expected:
                failed.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    if failed:
        raise SystemExit('Generated resources differ: ' + ', '.join(failed))
    print(('Verified' if args.check else 'Generated') + f' {len(outputs())} vector/XML files; no network or new packages')


if __name__ == '__main__':
    main()
