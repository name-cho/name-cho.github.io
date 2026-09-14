#!/usr/bin/env python3
import html
import re

INLINE_CODE_RE = re.compile(r'(`+)(.+?)\1', re.S)
TOC_HEADINGS = ('Содержание', 'Table of Contents', 'Contents')
TOC_HEAD_RE = re.compile(r'^#{2,3}\s+(' + '|'.join(TOC_HEADINGS) + r')\s*$', re.I)
LIST_ITEM_RE = re.compile(r'^\s*([-*+]|\d+\.)\s+')
BLOCK_START_RE = re.compile(r'^\s*(?:#{1,6}\s|```|>|\||-{3,}\s*$|(?:[-*+]|\d+\.)\s+)')


def esc(s):
    return html.escape(s, quote=False)


def slugify(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[`*_]', '', text.strip().lower())
    text = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    text = re.sub(r'[\s]+', '-', text)
    return re.sub(r'-+', '-', text).strip('-') or 'section'


def inline(text):
    placeholders = {}

    def stash(m):
        key = '\x00%d\x00' % len(placeholders)
        placeholders[key] = '<code>%s</code>' % esc(m.group(2).strip())
        return key

    text = INLINE_CODE_RE.sub(stash, text)
    text = esc(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text, flags=re.S)
    text = re.sub(r'(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)', r'<em>\1</em>', text, flags=re.S)
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', text)
    for k, v in placeholders.items():
        text = text.replace(k, v)
    return text


KEYWORDS = {
    'uniland': r'\b(let|const|if|else|while|for|in|of|function|return|break|continue|try|catch|finally|throw|python|true|false|null|and|or|not|import|export|class|new|typeof|await|async|do|switch|case|default|py)\b',
    'python': r'\b(def|class|return|if|elif|else|for|while|in|not|and|or|import|from|as|with|try|except|finally|raise|lambda|yield|pass|break|continue|True|False|None|self|global|nonlocal|assert|del|is|async|await)\b',
    'bash': r'\b(git|cd|pip|pip3|python|python3|uniland|bash|powershell|curl|wget|ls|cat|echo|mkdir|rm|cp|mv|sudo|chmod|make|cargo|npm|node)\b',
    'javascript': r'\b(let|const|var|function|return|if|else|for|while|class|new|import|export|from|await|async|try|catch|throw|typeof|null|true|false)\b',
    'json': None,
}

TOKEN_CSS = """
.page-module__iRtBbG__tokKey{color:var(--primary)}
.page-module__iRtBbG__tokStr{color:var(--secondary)}
.page-module__iRtBbG__tokNum,.page-module__iRtBbG__tokBool{color:var(--tertiary)}
.page-module__iRtBbG__tokPunct{color:var(--text-muted)}
.page-module__iRtBbG__tokComment{color:var(--text-muted);font-style:italic;opacity:.75}
"""


def highlight_code(code, lang):
    lang = (lang or '').strip().lower()
    lang = {'uni': 'uniland', 'sh': 'bash', 'shell': 'bash', 'console': 'bash',
            'zsh': 'bash', 'py': 'python', 'js': 'javascript'}.get(lang, lang)

    if lang == 'json':
        parts = [
            (r'("(?:[^"\\]|\\.)*")(\s*:)', 'tokKey'),
            (r'("(?:[^"\\]|\\.)*")', 'tokStr'),
            (r'\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b', 'tokNum'),
            (r'\b(true|false|null)\b', 'tokBool'),
            (r'[{}\[\],:]', 'tokPunct'),
        ]
    elif KEYWORDS.get(lang):
        parts = [
            (r'(?m)(^[ \t]*(?://|#).*$)', 'tokComment'),
            (r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|`(?:[^`\\]|\\.)*`)', 'tokStr'),
            (KEYWORDS[lang], 'tokKey'),
            (r'\b(\d+(?:\.\d+)?)\b', 'tokNum'),
            (r'\b(true|false|null|None|True|False)\b', 'tokBool'),
        ]
    else:
        parts = [
            (r'(?m)(^[ \t]*(?://|#).*$)', 'tokComment'),
            (r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')', 'tokStr'),
            (r'\b(\d+(?:\.\d+)?)\b', 'tokNum'),
        ]

    tokens = []

    def tokenise(src):
        if not src:
            return
        best = None
        for pat, cls in parts:
            m = re.compile(pat).search(src)
            if m and (best is None or m.start() < best[0].start()):
                best = (m, cls)
        if best is None:
            tokens.append(('plain', src))
            return
        m, cls = best
        if m.start() > 0:
            tokens.append(('plain', src[:m.start()]))
        tokens.append((cls, m.group(0)))
        tokenise(src[m.end():])

    tokenise(code)
    out = []
    for cls, txt in tokens:
        txt = esc(txt)
        out.append(txt if cls == 'plain' else '<span class="page-module__iRtBbG__%s">%s</span>' % (cls, txt))
    return ''.join(out)


def code_block(code, lang):
    label = (lang or 'text').strip().lower() or 'text'
    body = highlight_code(code.rstrip('\n'), label)
    raw = esc(code.rstrip('\n')).replace('"', '&quot;').replace('\n', '&#10;')
    return ('<div class="page-module__iRtBbG__codeBlock">'
            '<div class="page-module__iRtBbG__codeHeader">'
            '<span class="page-module__iRtBbG__codeLang">%s</span>'
            '<button class="page-module__iRtBbG__copyBtn" type="button" data-code="%s">'
            '<i class="fas fa-copy"></i><span class="copyLabel">Copy</span></button>'
            '</div><pre><code>%s</code></pre></div>' % (esc(label), raw, body))


def raw_code_block(code, lang):
    return code_block(code, lang)


def render_list(items, ordered):
    if not items:
        return ''
    base = min(it[0] for it in items)
    tag = 'ol' if ordered else 'ul'
    parts = ['<%s>' % tag]
    idx = 0
    while idx < len(items):
        indent, text = items[idx]
        if indent > base:
            nested = []
            while idx < len(items) and items[idx][0] > base:
                nested.append(items[idx])
                idx += 1
            sub = render_list([(i2 - nested[0][0], t2) for i2, t2 in nested], False)
            if parts[-1].endswith('</li>'):
                parts[-1] = parts[-1][:-len('</li>')] + sub + '</li>'
            else:
                parts.append(sub)
            continue
        parts.append('<li>%s</li>' % inline(text))
        idx += 1
    parts.append('</%s>' % tag)
    return ''.join(parts)


def balance(body):
    result = []
    stack = []
    pattern = (r'(?:<div class="page-module__iRtBbG__subsection"[^>]*>'
               r'|<div class="page-module__iRtBbG__section"[^>]*>)')
    for chunk in re.split('(' + pattern + ')', body):
        if chunk.startswith('<div class="page-module__iRtBbG__subsection"'):
            while stack and stack[-1] == 'sub':
                result.append('</div>')
                stack.pop()
            result.append(chunk)
            stack.append('sub')
            continue
        if chunk.startswith('<div class="page-module__iRtBbG__section"'):
            while stack:
                result.append('</div>')
                stack.pop()
            result.append(chunk)
            stack.append('sec')
            continue
        result.append(chunk)
    while stack:
        result.append('</div>')
        stack.pop()
    return ''.join(result)


def convert(md):
    lines = md.split('\n')

    if sum(1 for l in lines[:40] if l.startswith('  ') and l.strip()) > 5:
        lines = [l[2:] if l.startswith('  ') else l for l in lines]

    out = []
    toc = []
    ids = set()
    section = 0
    sub = 0
    i = 0
    n = len(lines)

    def unique(slug):
        base, k = slug, 2
        while slug in ids:
            slug = '%s-%d' % (base, k)
            k += 1
        ids.add(slug)
        return slug

    while i < n:
        line = lines[i]
        s = line.strip()

        if s.startswith('```'):
            lang = s[3:].strip()
            buf = []
            i += 1
            while i < n and not lines[i].strip().startswith('```'):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append(code_block('\n'.join(buf), lang))
            continue

        if re.fullmatch(r'(-{3,}|\*{3,}|_{3,})', s):
            out.append('<hr class="page-module__iRtBbG__hr">')
            i += 1
            continue

        if TOC_HEAD_RE.match(s):
            i += 1
            while i < n:
                st = lines[i].strip()
                if not st or LIST_ITEM_RE.match(st):
                    i += 1
                    continue
                break
            continue

        m = re.match(r'^(#{1,6})\s+(.*)$', s)
        if m:
            level = len(m.group(1))
            raw_text = m.group(2).strip()
            text = inline(raw_text)
            slug = unique(slugify(raw_text))
            if level == 1:
                out.append('<h1 id="%s">%s</h1>' % (slug, text))
            elif level == 2:
                section += 1
                sub = 0
                out.append('<div class="page-module__iRtBbG__section" id="%s">' % slug)
                out.append('<div class="page-module__iRtBbG__sectionHead">'
                           '<span class="page-module__iRtBbG__sectionNumber">%d</span>'
                           '<h2 class="page-module__iRtBbG__sectionPlain">%s</h2></div>' % (section, text))
                toc.append({'level': 2, 'text': raw_text, 'id': slug, 'num': str(section)})
            else:
                sub += 1
                out.append('<div class="page-module__iRtBbG__subsection" id="%s"><h3>%s</h3>' % (slug, text))
                toc.append({'level': level, 'text': raw_text, 'id': slug,
                            'num': '%d.%d' % (section, sub)})
            i += 1
            continue

        if s.startswith('|') and i + 1 < n and re.match(r'^\s*\|[\s:|-]+\|\s*$', lines[i + 1]):
            header = [c.strip() for c in s.strip('|').split('|')]
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            t = ['<table class="page-module__iRtBbG__mdTable"><thead><tr>']
            t += ['<th>%s</th>' % inline(h) for h in header]
            t.append('</tr></thead><tbody>')
            for r in rows:
                t.append('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>')
            t.append('</tbody></table>')
            out.append(''.join(t))
            continue

        if s.startswith('>'):
            buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip().lstrip('>').strip())
                i += 1
            out.append('<div class="page-module__iRtBbG__note"><i class="fas fa-circle-info"></i>'
                       '<p>%s</p></div>' % inline(' '.join(buf)))
            continue

        if LIST_ITEM_RE.match(line):
            ordered = bool(re.match(r'^\s*\d+\.\s+', line))
            items = []
            while i < n and LIST_ITEM_RE.match(lines[i]):
                indent = len(lines[i]) - len(lines[i].lstrip())
                items.append((indent, re.sub(r'^\s*([-*+]|\d+\.)\s+', '', lines[i])))
                i += 1
            out.append(render_list(items, ordered))
            continue

        if s:
            buf = [s]
            i += 1
            while i < n and lines[i].strip() and not BLOCK_START_RE.match(lines[i]):
                buf.append(lines[i].strip())
                i += 1
            out.append('<p class="page-module__iRtBbG__p">%s</p>' % inline(' '.join(buf)))
            continue

        i += 1

    body = '\n'.join(out)
    body = re.sub(r'(?:<hr class="page-module__iRtBbG__hr">\s*){2,}',
                  '<hr class="page-module__iRtBbG__hr">', body)
    return balance(body), toc


def toc_html(toc, label='Contents'):
    parts = ['<div class="page-module__iRtBbG__tocLabel">%s</div>' % esc(label),
             '<nav class="page-module__iRtBbG__tocList">']
    for it in toc:
        cls = 'page-module__iRtBbG__tocLink' + (' page-module__iRtBbG__tocLinkSub' if it['level'] >= 3 else '')
        parts.append('<a class="%s" href="#%s">'
                     '<span class="page-module__iRtBbG__tocLinkNumber">%s</span>'
                     '<span class="page-module__iRtBbG__tocLinkText">%s</span></a>'
                     % (cls, it['id'], esc(it['num']), esc(it['text'].replace('`', ''))))
    parts.append('</nav>')
    return ''.join(parts)


if __name__ == '__main__':
    import sys
    body, toc = convert(open(sys.argv[1], encoding='utf-8').read())
    open(sys.argv[2], 'w', encoding='utf-8').write(body)
    print('toc entries:', len(toc), '| bytes:', len(body))
