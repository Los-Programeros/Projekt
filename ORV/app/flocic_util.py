import numpy as np
from PIL import Image
import struct
import math
import sys
import os
from bitstream import BitStream
# try:
#     from .bitstream import BitStream 
# except ImportError:
#     from bitstream import BitStream 

sys.setrecursionlimit(2000000)

def predict(P, X, Y):
    E = np.zeros(X * Y, dtype=np.int32)
    P = P.astype(np.int32)
    for y in range(Y):
        for x in range(X):
            i = y * X + x
            if x == 0 and y == 0: E[i] = P[0, 0]
            elif y == 0: E[i] = P[x - 1, 0] - P[x, 0]
            elif x == 0: E[i] = P[0, y - 1] - P[0, y]
            else:
                a, b, c = P[x, y - 1], P[x - 1, y], P[x - 1, y - 1]
                pred = min(a, b) if c >= max(a, b) else (max(a, b) if c <= min(a, b) else a + b - c)
                E[i] = pred - P[x, y]
    return E

def inverse_predict(E, X, Y):
    P = np.zeros((X, Y), dtype=np.int32)
    for y in range(Y):
        for x in range(X):
            i = y * X + x
            if x == 0 and y == 0: P[x, y] = E[i]
            elif y == 0: P[x, 0] = P[x - 1, 0] - E[i]
            elif x == 0: P[0, y] = P[0, y - 1] - E[i]
            else:
                a, b, c = P[x, y - 1], P[x - 1, y], P[x - 1, y - 1]
                pred = min(a, b) if c >= max(a, b) else (max(a, b) if c <= min(a, b) else a + b - c)
                P[x, y] = pred - E[i]
    return np.clip(P, 0, 255).astype(np.uint8)

def ic(C, L, H, cl, cr, B):
    if H - L > 1:
        if cr != cl:
            m = math.floor(0.5 * (H + L))
            g = math.ceil(math.log2(cr - cl + 1))
            B.write_bits(int(C[m] - cl), g)
            if L < m: ic(C, L, m, cl, C[m], B)
            if m < H: ic(C, m, H, C[m], cr, B)

def de_ic(C, L, H, cl, cr, B):
    if H - L > 1:
        if cl == cr:
            for i in range(L + 1, H): C[i] = cl
        else:
            m = math.floor(0.5 * (H + L))
            g = math.ceil(math.log2(cr - cl + 1))
            val = B.read_bits(g)
            C[m] = cl + val
            if L < m: de_ic(C, L, m, cl, C[m], B)
            if m < H: de_ic(C, m, H, C[m], cr, B)

def compress_to_file(image_array, output_path):
    """Compresses a grayscale numpy array to a FLoCIC .bin file"""
    X, Y = image_array.shape
    n = X * Y
    E = predict(image_array, X, Y)
    N = np.where(E >= 0, 2 * E, 2 * np.abs(E) - 1).astype(np.int64)
    C = np.cumsum(N)
    
    B = BitStream()
    ic(C, 0, n - 1, C[0], C[n-1], B)
    with open(output_path, 'wb') as f:
        f.write(struct.pack('<HBI I', X, int(C[0]), int(C[n-1]), n))
        f.write(B.get_bytes())

# def decompress_to_array(input_path):
#     """Decompresses a FLoCIC .bin file back to a numpy array"""
#     with open(input_path, 'rb') as f:
#         data = f.read()
#     X, c0, clast, n = struct.unpack('<HBI I', data[:11])
#     B = BitStream(data[11:])
#     C = np.zeros(n, dtype=np.int64)
#     C[0], C[n-1] = c0, clast
#     de_ic(C, 0, n - 1, C[0], C[n-1], B)
#     N = np.concatenate(([C[0]], np.diff(C)))
#     E = np.where(N % 2 == 0, N // 2, -((N + 1) // 2)).astype(np.int32)
#     return inverse_predict(E, X, n // X)

def decompress_to_array(input_path):
    with open(input_path, 'rb') as f:
        data = f.read()
    
    # Header unpacking (X, c0, clast, n)
    X, c0, clast, n = struct.unpack('<HBI I', data[:11])
    B = BitStream(data[11:])
    
    C = np.zeros(n, dtype=np.int64)
    C[0], C[n-1] = c0, clast
    
    # Run de-interpolation coding
    de_ic(C, 0, n - 1, C[0], C[n-1], B)
    
    # Reconstruct differences
    N = np.zeros(n, dtype=np.int64)
    N[0] = C[0]
    for i in range(1, n):
        N[i] = C[i] - C[i-1]
        
    # Reconstruct Prediction Errors
    E = np.zeros(n, dtype=np.int32)
    E[0] = N[0]
    for i in range(1, n):
        if N[i] % 2 == 0: E[i] = N[i] // 2
        else: E[i] = -((N[i] + 1) // 2)
        
    Y = n // X
    # Return the restored image as a numpy array
    return inverse_predict(E, X, Y)