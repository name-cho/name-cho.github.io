#!/usr/bin/env python3
import base64
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = '6.5.2'
BASE = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/%s/webfonts/' % VERSION

SOLID = {
    'fa-house': 'f015', 'fa-box-open': 'f49e', 'fa-bars': 'f0c9', 'fa-cog': 'f013', 'fa-gear': 'f013',
    'fa-sun': 'f185', 'fa-moon': 'f186', 'fa-chevron-right': 'f054', 'fa-chevron-down': 'f078',
    'fa-chevron-left': 'f053', 'fa-chevron-up': 'f077', 'fa-check': 'f00c', 'fa-xmark': 'f00d',
    'fa-arrow-right': 'f061', 'fa-arrow-left': 'f060', 'fa-up-right-from-square': 'f35d',
    'fa-ellipsis': 'f141', 'fa-plus': 'f067', 'fa-minus': 'f068', 'fa-rotate': 'f2f1',
    'fa-arrows-rotate': 'f021', 'fa-filter': 'f0b0', 'fa-sort': 'f0dc', 'fa-angle-down': 'f107',
    'fa-angle-right': 'f105',
    'fa-star': 'f005', 'fa-code-branch': 'f126', 'fa-clock': 'f017', 'fa-arrow-down-a-z': 'f15d',
    'fa-weight-hanging': 'f5cd', 'fa-code-commit': 'f386', 'fa-hard-drive': 'f0a0',
    'fa-database': 'f1c0', 'fa-download': 'f019', 'fa-copy': 'f0c5', 'fa-circle-info': 'f05a',
    'fa-circle-play': 'f144', 'fa-link': 'f0c1', 'fa-hashtag': 'f292', 'fa-at': 'f1fa',
    'fa-envelope': 'f0e0', 'fa-paperclip': 'f0c6', 'fa-user-secret': 'f21b', 'fa-globe': 'f0ac',
    'fa-user': 'f007', 'fa-users': 'f0c0', 'fa-tag': 'f02b', 'fa-tags': 'f02c', 'fa-key': 'f084',
    'fa-lock': 'f023', 'fa-shield-halved': 'f3ed', 'fa-flag': 'f024', 'fa-bell': 'f0f3',
    'fa-qrcode': 'f029', 'fa-cube': 'f1b2', 'fa-cubes': 'f1b3', 'fa-box': 'f466',
    'fa-box-archive': 'f187', 'fa-swatchbook': 'f5c3', 'fa-network-wired': 'f6ff',
    'fa-plug': 'f1e6', 'fa-wand-magic-sparkles': 'f520',
    'fa-pen-nib': 'f5ad', 'fa-code': 'f121', 'fa-headphones': 'f025', 'fa-robot': 'f544',
    'fa-mobile-screen-button': 'f3cd', 'fa-tv': 'f26c', 'fa-comment-dots': 'f4ad', 'fa-store': 'f54e',
    'fa-ghost': 'f6e2', 'fa-calculator': 'f1ec', 'fa-list-check': 'f0ae', 'fa-language': 'f1ab',
    'fa-music': 'f001', 'fa-radio': 'f8d7', 'fa-terminal': 'f120', 'fa-ban': 'f05e',
    'fa-feather': 'f52d', 'fa-flask': 'f0c3', 'fa-book': 'f02d', 'fa-file-code': 'f1c9',
    'fa-folder-open': 'f07c', 'fa-microchip': 'f2db', 'fa-server': 'f233', 'fa-keyboard': 'f11c',
    'fa-gamepad': 'f11b', 'fa-clapperboard': 'e131', 'fa-film': 'f008', 'fa-image': 'f03e',
    'fa-video': 'f03d', 'fa-camera-retro': 'f083', 'fa-mask': 'f6fa', 'fa-hat-wizard': 'f6e8',
    'fa-dragon': 'f6d5', 'fa-dice': 'f522', 'fa-puzzle-piece': 'f12e', 'fa-screwdriver-wrench': 'f7d9',
    'fa-hammer': 'f6e3', 'fa-gears': 'f085', 'fa-layer-group': 'f5fd', 'fa-diagram-project': 'f542',
    'fa-scale-balanced': 'f24e', 'fa-triangle-exclamation': 'f071', 'fa-circle-check': 'f058',
    'fa-circle-question': 'f059', 'fa-magnifying-glass': 'f002', 'fa-bolt': 'f0e7',
    'fa-fire': 'f06d', 'fa-leaf': 'f06c', 'fa-cloud': 'f0c2', 'fa-satellite-dish': 'f7c0',
    'fa-tower-broadcast': 'f519', 'fa-taxi': 'f1ba', 'fa-car': 'f1b9',
}

BRANDS = {
    'fa-github': 'f09b', 'fa-gitlab': 'f296', 'fa-telegram': 'f2c6', 'fa-vk': 'f189',
    'fa-discord': 'f392', 'fa-bluesky': 'e671', 'fa-mastodon': 'f4f6', 'fa-git-alt': 'f841',
    'fa-python': 'f3e2', 'fa-rust': 'e07a', 'fa-js': 'f3b8', 'fa-linux': 'f17c',
    'fa-android': 'f17b', 'fa-html5': 'f13b', 'fa-css3-alt': 'f38b', 'fa-node-js': 'f3d3',
    'fa-docker': 'f395', 'fa-ubuntu': 'f7df', 'fa-archlinux': 'f557', 'fa-apple': 'f179',
    'fa-windows': 'f17a', 'fa-youtube': 'f167', 'fa-twitch': 'f1e8', 'fa-spotify': 'f1bc',
    'fa-soundcloud': 'f1be', 'fa-steam': 'f1b6', 'fa-reddit': 'f1a1', 'fa-x-twitter': 'e61b',
    'fa-instagram': 'f16d',
}


def fetch(name):
    req = urllib.request.Request(BASE + name, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=60).read()


def main():
    solid = fetch('fa-solid-900.woff2')
    brands = fetch('fa-brands-400.woff2')

    used = set()
    for root, _dirs, files in os.walk(HERE):
        if 'assets' in root or root.endswith('__pycache__'):
            continue
        for f in files:
            if f.endswith(('.html', '.js')):
                used |= set(re.findall(r'\bfa-[a-z0-9][a-z0-9-]*', open(os.path.join(root, f), encoding='utf-8').read()))
    used |= set(re.findall(r'\bfa-[a-z0-9][a-z0-9-]*', open(os.path.join(HERE, 'assets', 'fx.css'), encoding='utf-8').read()))

    solid_used = {k: v for k, v in SOLID.items() if k in used}
    brands_used = {k: v for k, v in BRANDS.items() if k in used}
    missing = sorted(used - set(solid_used) - set(brands_used) -
                     {'fa-spin', 'fa-fw', 'fa-xs', 'fa-sm', 'fa-lg', 'fa-xl', 'fa-2x',
                      'fa-solid', 'fa-regular', 'fa-brands', 'fas', 'far', 'fab', 'fa'})
    print('icons used: %d (solid %d, brands %d), unmapped: %s'
          % (len(used), len(solid_used), len(brands_used), missing or 'none'))

    out = ['/*! Font Awesome Free %s subset, SIL OFL 1.1 */' % VERSION,
           "@font-face{font-family:'Font Awesome 6 Free';font-style:normal;font-weight:900;"
           'font-display:block;src:url(data:font/woff2;base64,%s) format("woff2")}'
           % base64.b64encode(solid).decode(),
           "@font-face{font-family:'Font Awesome 6 Brands';font-style:normal;font-weight:400;"
           'font-display:block;src:url(data:font/woff2;base64,%s) format("woff2")}'
           % base64.b64encode(brands).decode(),
           '.fa,.fas,.fa-solid,.far,.fa-regular,.fab,.fa-brands{-moz-osx-font-smoothing:grayscale;'
           '-webkit-font-smoothing:antialiased;display:inline-block;font-style:normal;'
           'font-variant:normal;line-height:1;text-rendering:auto}',
           '.fas,.fa-solid,.fa,.far,.fa-regular{font-family:"Font Awesome 6 Free";font-weight:900}',
           '.fab,.fa-brands{font-family:"Font Awesome 6 Brands";font-weight:400}',
           '.fa-fw{text-align:center;width:1.25em}',
           '.fa-xs{font-size:.75em}.fa-sm{font-size:.875em}.fa-lg{font-size:1.33em}'
           '.fa-xl{font-size:1.5em}.fa-2x{font-size:2em}',
           '.fa-spin{animation:fa-spin 1s infinite linear}@keyframes fa-spin{0%{transform:rotate(0)}'
           '100%{transform:rotate(360deg)}}']
    for n, cp in solid_used.items():
        out.append('.%s:before{content:"\\%s"}' % (n, cp))
    for n, cp in brands_used.items():
        out.append('.%s:before{content:"\\%s"}' % (n, cp))
    open(os.path.join(HERE, 'assets', 'fontawesome-subset.css'), 'w', encoding='utf-8').write('\n'.join(out))
    print('assets/fontawesome-subset.css:', os.path.getsize(os.path.join(HERE, 'assets', 'fontawesome-subset.css')), 'bytes')


if __name__ == '__main__':
    main()
