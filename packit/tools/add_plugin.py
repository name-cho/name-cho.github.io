#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bithash import bithash_hex  # noqa: E402

TAG_COLORS = {
    'Featured': 'key_avatar_backgroundInProfileBlue',
    'Utility': 'key_avatar_backgroundGreen',
    'Tweaks': 'key_avatar_background2Cyan',
    'Customization': 'key_avatar_backgroundPurple',
    'System': 'key_avatar_backgroundOrange',
    'DevTools': 'key_avatar_backgroundRed',
    'Library': 'key_avatar_backgroundGrey',
    'Fun': 'key_avatar_backgroundCyan',
}

def human_size(n):
    if n < 1024:
        return '%d B' % n
    if n < 1024 * 1024:
        return '%.2f KB' % (n / 1024)
    if n < 1024 * 1024 * 1024:
        return '%.2f MB' % (n / 1024 / 1024)
    return '%.2f GB' % (n / 1024 / 1024 / 1024)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--id', required=True)
    ap.add_argument('--name', required=True)
    ap.add_argument('--version', required=True)
    ap.add_argument('--author', default='@name_cho')
    ap.add_argument('--state', default='release', choices=['release', 'beta', 'alpha'])
    ap.add_argument('--desc', default='')
    ap.add_argument('--icon', default='')
    ap.add_argument('--tags', default='')
    ap.add_argument('--app-version', default='')
    ap.add_argument('--sdk-version', default='Unknown')
    ap.add_argument('--restart', default='', choices=['', 'required', 'optional'])
    ap.add_argument('--readme', default='')
    ap.add_argument('--source', default='')
    ap.add_argument('--license', default='')
    ap.add_argument('--langs', default='')
    ap.add_argument('--bugs', default='')
    ap.add_argument('--base-url', default='https://name-cho.github.io/packit')
    ap.add_argument('--no-copy', action='store_true')
    a = ap.parse_args()

    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pj_path = os.path.join(here, 'plugins.json')
    data = json.load(open(pj_path, encoding='utf-8'))

    raw = open(a.file, 'rb').read()
    rel = '%s_%s.plugin' % (a.id, a.version)
    if not a.no_copy:
        dst = os.path.join(here, 'plugins', rel)
        shutil.copyfile(a.file, dst)
        print('copied ->', os.path.relpath(dst, here))
    link = '%s/plugins/%s' % (a.base_url.rstrip('/'), rel)

    entry = {
        'id': a.id,
        'name': a.name,
        'author': a.author,
        'version': a.version,
        'state': a.state,
        'icon': a.icon or 'Unknown',
        'min_version': a.app_version or 'Unknown',
        'app_version': a.app_version or 'Unknown',
        'sdk_version': a.sdk_version,
        'suspicious': 'false',
        'link': link,
        'size': human_size(len(raw)),
        'description': a.desc,
        'hash': hashlib.sha256(raw).hexdigest(),
        'bithash': bithash_hex(raw),
        'tags': [[t.strip(), TAG_COLORS.get(t.strip(), 'key_avatar_backgroundGreen'), '']
                 for t in a.tags.split(',') if t.strip()],
    }
    if a.restart:
        entry['restart'] = a.restart
    if a.readme:
        entry['readme'] = a.readme
    if a.source or a.license or a.langs or a.bugs:
        src = {}
        src['clients'] = ['exteraGram', 'AyuGram']
        if a.license:
            src['license'] = a.license
        if a.source:
            src['source_links'] = a.source
        if a.langs:
            src['langs'] = [x.strip() for x in a.langs.split(',') if x.strip()]
        if a.bugs:
            src['bug_reports'] = a.bugs
        entry['sources'] = src

    plugins = [p for p in data.get('plugins', []) if p.get('id') != a.id]
    plugins.append(entry)
    data['plugins'] = plugins

    counts = {}
    for p in plugins:
        for t in p.get('tags', []):
            counts[t[0]] = counts.get(t[0], 0) + 1
    data['tags_summary'] = counts

    json.dump(data, open(pj_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('plugins.json updated: %d plugin(s), tags: %s' % (len(plugins), counts or '{}'))
    print(json.dumps(entry, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
