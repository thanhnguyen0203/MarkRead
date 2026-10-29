"""P4A resource/geometry/packaging guard. Standard library only; never changes app data."""
from pathlib import Path
import importlib.util
import json
import struct
import sys
import xml.etree.ElementTree as ET
import zlib

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'app/src/main/res'
ART = ROOT / 'design/launcher/markread'
NS = '{http://schemas.android.com/apk/res/android}'
checks = []


def check(value, name):
    if not value:
        raise AssertionError(name)
    checks.append(name)


def png_info(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    at = 8
    chunks = []
    while at < len(data):
        length = struct.unpack('>I', data[at:at + 4])[0]
        kind = data[at + 4:at + 8]
        payload = data[at + 8:at + 8 + length]
        crc = struct.unpack('>I', data[at + 8 + length:at + 12 + length])[0]
        assert zlib.crc32(kind + payload) & 0xffffffff == crc
        chunks.append((kind, payload))
        at += length + 12
    assert chunks[-1][0] == b'IEND'
    width, height, depth, color, *_ = struct.unpack('>IIBBBBB', chunks[0][1])
    raw = zlib.decompress(b''.join(p for k, p in chunks if k == b'IDAT'))
    assert depth == 8 and color in [2, 6]
    bpp = 4 if color == 6 else 3
    assert len(raw) == height * (1 + width * bpp)
    return width, height, raw, bpp


def main():
    sys.dont_write_bytecode = True
    loader = importlib.util.spec_from_file_location('launcher_generator', ROOT / 'scripts/Generate-LauncherIcons.py')
    gen = importlib.util.module_from_spec(loader)
    loader.loader.exec_module(gen)
    for path, content in gen.outputs().items():
        check(path.read_bytes() == content.encode('utf-8'), 'source/export parity: ' + str(path.relative_to(ROOT)))
    spec = json.loads((ART / 'concepts.json').read_text())
    check(len(spec['concepts']) == 3 and spec['selected'] == 'A', 'three original concepts, Open Book selected')
    check(spec['background'] == '#202326' and spec['accent'] == '#91C7B0', 'Quiet Ink colors retained')
    def luminance(color):
        values = [int(color[i:i + 2], 16) / 255 for i in [1, 3, 5]]
        return sum((v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4) * w for v, w in zip(values, [.2126, .7152, .0722]))
    for label, fg_color, bg_color in [('brand', spec['accent'], spec['background']), ('themed light simulation', '#254A38', '#D8EADB'), ('themed dark simulation', '#C7EAD5', '#344C40')]:
        a, b = sorted([luminance(fg_color), luminance(bg_color)])
        check((b + .05) / (a + .05) >= 3, label + ': identity contrast >=3:1')
    app = ET.parse(ROOT / 'app/src/main/AndroidManifest.xml').getroot().find('application')
    check(app.get(NS + 'icon') == '@mipmap/ic_launcher', 'default launcher reference')
    check(app.get(NS + 'roundIcon') == '@mipmap/ic_launcher_round', 'round launcher reference')
    for api in [26, 33]:
        for name in ['ic_launcher', 'ic_launcher_round']:
            icon = ET.parse(RES / f'mipmap-anydpi-v{api}/{name}.xml').getroot()
            expected = ['background', 'foreground'] + (['monochrome'] if api >= 33 else [])
            check(icon.tag == 'adaptive-icon' and [c.tag for c in icon] == expected, f'API{api} {name}: correct layers')
            for layer in icon:
                ref = layer.get(NS + 'drawable')
                check(ref.startswith('@drawable/') and (RES / (ref[1:] + '.xml')).exists(), f'API{api} {name}: {layer.tag} resolves')
    fg = ET.parse(RES / 'drawable/ic_foreground.xml').getroot()
    mono = ET.parse(RES / 'drawable/ic_monochrome.xml').getroot()
    check(fg.get(NS + 'width') == fg.get(NS + 'height') == '108dp', 'foreground 108dp layer')
    check(mono.get(NS + 'width') == mono.get(NS + 'height') == '108dp', 'monochrome 108dp layer')
    check([p.get(NS + 'pathData') for p in fg] == [p.get(NS + 'pathData') for p in mono], 'monochrome preserves silhouette and negative space')
    check(all(p.get(NS + 'fillColor') == '#000000' and p.get(NS + 'fillType') == 'evenOdd' for p in mono), 'monochrome pure opaque alpha silhouette with transparent holes')
    check(all(p.tag == 'path' and p.get(NS + 'strokeColor') is None for p in fg), 'foreground has no mask, background, shadows or strokes')
    for density, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        for name in ['ic_launcher', 'ic_launcher_round']:
            w, h, raw, bpp = png_info(RES / f'mipmap-{density}/{name}.png')
            check(w == h == size, f'{density} {name}: correct density dimensions, PNG CRC/decode')
            # PNG first pixel: filter has no nonzero left/above predictor at the origin.
            check(raw[1:4] == (bytes.fromhex('202326') if name == 'ic_launcher' else b'\0\0\0'), f'{density} {name}: full-bleed graphite or transparent round corner')
            if name.endswith('round'):
                check(bpp == 4 and raw[4] == 0, f'{density} round: corner transparent')
    geometry = json.loads((ROOT / 'docs/release/assets/p4a/geometry.json').read_text())
    for c in geometry['concepts']:
        check(c['maxRadius'] <= 33 and c['painted'] > 0, c['id'] + ': rendered silhouette inside safe circle')
    selected = next(c for c in geometry['concepts'] if c['id'] == spec['selected'])
    check(selected['width'] >= 48 and selected['height'] >= 48, 'selected identity at least 48dp in both dimensions')
    check(geometry['networkRequests'] == 0, 'offline preview export made zero network requests')
    for path in ART.glob('*.svg'):
        svg = ET.parse(path).getroot()
        check(all(e.tag.split('}')[-1] in ['svg', 'title', 'path'] and not any('href' in k or k.startswith('on') for k in e.attrib) for e in svg.iter()), path.name + ': inert original SVG')
    result = {'pass': len(checks), 'fail': 0, 'checks': checks, 'geometry': geometry}
    if len(sys.argv) > 1:
        out = Path(sys.argv[1]); out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'Launcher resources: {len(checks)} checks PASS')


if __name__ == '__main__':
    main()
