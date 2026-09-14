#!/usr/bin/env python3

M64 = (1 << 64) - 1

P0 = 0x9E3779B97F4A7C15
P1 = 0x6C62272E07BB0142
P2 = 0x94D049BB133111EB
P3 = 0xBF58476D1CE4E5B9

BULK_STEP = 32

def _load64(b, i):
    return int.from_bytes(b[i:i + 8], 'little')

def _load32(b, i):
    return int.from_bytes(b[i:i + 4], 'little')

def _mum(a, b):
    r = (a & M64) * (b & M64)
    return ((r >> 64) ^ r) & M64

def _mix(a, b):
    return _mum(a ^ P0, b ^ P1)

def _tail(p, length, state):
    i = 0
    if length >= 16:
        state = _mum(state ^ _load64(p, i), P2)
        state = _mum(state ^ _load64(p, i + 8), P3)
        i += 16
        length -= 16
    if length >= 8:
        state = _mum(state ^ _load64(p, i), P0)
        i += 8
        length -= 8
    if length >= 4:
        state ^= _load32(p, i) | (_load32(p, i + length - 4) << 32)
        state = _mum(state, P1)
        i += 4
        length -= 4
    if length > 0:
        v = p[i] | (p[i + (length >> 1)] << 8) | (p[i + length - 1] << 16)
        state = _mum(state ^ v, P2)
    return state

def _finalize(s0, s1, s2, s3, length):
    h = _mix(s0, s1) ^ _mix(s2, s3)
    h = _mum(h ^ (length & M64), P3)
    h ^= h >> 33
    h = (h * P0) & M64
    h ^= h >> 29
    h = (h * P2) & M64
    h ^= h >> 32
    return h

def bithash(data, seed=0):
    if isinstance(data, (bytearray, memoryview)):
        data = bytes(data)
    s0 = (seed ^ P0) & M64
    s1 = (seed ^ P1) & M64
    s2 = (seed ^ P2) & M64
    s3 = (seed ^ P3) & M64

    blocks = len(data) // BULK_STEP
    for b in range(blocks):
        o = b * BULK_STEP
        s0 = _mum(s0 ^ _load64(data, o), P1)
        s1 = _mum(s1 ^ _load64(data, o + 8), P2)
        s2 = _mum(s2 ^ _load64(data, o + 16), P3)
        s3 = _mum(s3 ^ _load64(data, o + 24), P0)

    rest = blocks * BULK_STEP
    t = _tail(data[rest:], len(data) - rest, (s0 ^ s1 ^ s2 ^ s3) & M64)
    return _finalize(s0, s1, s2, s3, (t ^ len(data)) & M64)

def bithash_file(path, seed=0):
    with open(path, 'rb') as f:
        return bithash(f.read(), seed)

def bithash_hex(data, seed=0):
    return '%016x' % bithash(data, seed)

def bithash_file_hex(path, seed=0):
    return '%016x' % bithash_file(path, seed)

if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        print(bithash_file_hex(p), p)
