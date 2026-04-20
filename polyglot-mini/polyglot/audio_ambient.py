"""Procedural ambient sound generator + WAV mixer.

Zero external dependencies — uses only numpy, scipy, and Python's stdlib `wave`.

Ambient categories:
  silence, rain, wind, city, forest, electronic, white_noise

Usage:
  from polyglot.audio_ambient import generate_ambient, mix_wav_files
  generate_ambient("rain", duration_s=10.0, out_path="ambient.wav", volume=0.3)
  mix_wav_files("speech.wav", "ambient.wav", "output.wav", ambient_vol=0.25)
"""
from __future__ import annotations
import io
import math
import os
import struct
import wave
import numpy as np
from scipy import signal as spsig


CATEGORIES = ["silence", "rain", "wind", "city", "forest", "electronic", "white_noise"]
FS = 22050  # sample rate for all ambient files


# ── WAV I/O (stdlib wave module, zero deps) ─────────────────────────────────

def _arr_to_bytes(arr: np.ndarray) -> bytes:
    """Float32 [-1,1] → 16-bit PCM bytes."""
    pcm = np.clip(arr, -1.0, 1.0)
    pcm = (pcm * 32767).astype(np.int16)
    return pcm.tobytes()


def save_wav(arr: np.ndarray, path: str, fs: int = FS) -> None:
    """Save mono float32 array as 16-bit mono WAV."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(fs)
        wf.writeframes(_arr_to_bytes(arr))


def load_wav_as_float(path: str) -> tuple[np.ndarray, int]:
    """Load WAV as float32 array in [-1, 1]."""
    with wave.open(path, "r") as wf:
        fs = wf.getframerate()
        n = wf.getnframes()
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        raw = wf.readframes(n)
    dtype = {1: np.int8, 2: np.int16, 4: np.int32}.get(sw, np.int16)
    arr = np.frombuffer(raw, dtype=dtype).astype(np.float32)
    if ch == 2:
        arr = arr.reshape(-1, 2).mean(axis=1)
    arr /= float(np.iinfo(dtype).max) if dtype != np.int8 else 127.0
    return arr, fs


def mix_wav_files(
    speech_path: str,
    ambient_path: str,
    out_path: str,
    *,
    ambient_vol: float = 0.25,
    fade_s: float = 0.4,
) -> None:
    """Mix speech + ambient WAV files and save as mono WAV."""
    sp, fs1 = load_wav_as_float(speech_path)
    am, fs2 = load_wav_as_float(ambient_path)

    # Resample ambient to match speech FS if needed
    if fs2 != fs1:
        ratio = fs1 / fs2
        am = spsig.resample(am, int(len(am) * ratio))

    # Tile or trim ambient to match speech length
    n = len(sp)
    if len(am) < n:
        reps = math.ceil(n / len(am))
        am = np.tile(am, reps)
    am = am[:n].copy()

    # Fade in/out on ambient
    fade_n = int(fade_s * fs1)
    if fade_n > 0 and len(am) > 2 * fade_n:
        fade = np.linspace(0, 1, fade_n)
        am[:fade_n] *= fade
        am[-fade_n:] *= fade[::-1]

    mixed = sp + am * ambient_vol
    # Normalize to 0.95 peak
    peak = np.abs(mixed).max()
    if peak > 0:
        mixed = mixed / peak * 0.95

    save_wav(mixed, out_path, fs=fs1)


# ── Procedural generators ────────────────────────────────────────────────────

def _pink_noise(n: int, rng: np.random.Generator) -> np.ndarray:
    """Generate pink noise via 1/f shaping in frequency domain."""
    white = rng.standard_normal(n)
    f = np.fft.rfftfreq(n); f[0] = f[1]
    W = np.fft.rfft(white) / np.sqrt(f)
    pink = np.fft.irfft(W, n)
    return pink / (np.abs(pink).max() + 1e-8)


def _bandpass(arr: np.ndarray, lo: float, hi: float, fs: int) -> np.ndarray:
    b, a = spsig.butter(3, [lo / (fs / 2), hi / (fs / 2)], btype="band")
    return spsig.filtfilt(b, a, arr)


def gen_rain(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    """Rain: broad pink noise with high-pass tilt + random droplet clicks."""
    base = _pink_noise(n, rng)
    # High-pass to get that airy rain texture
    b, a = spsig.butter(2, 800 / (fs / 2), btype="high")
    base = spsig.filtfilt(b, a, base) * 0.6
    # Droplets: sparse random gaussian pulses
    drops = np.zeros(n)
    n_drops = int(n / fs * rng.uniform(80, 150))
    for _ in range(n_drops):
        pos = rng.integers(0, n)
        amp = rng.uniform(0.05, 0.25)
        width = rng.integers(4, 20)
        drops[max(0, pos - width): pos + width] += amp * np.hanning(
            min(2 * width, n - max(0, pos - width))
        )[:min(2 * width, n - max(0, pos - width))]
    return base + drops * 0.4


def gen_wind(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    """Wind: slowly-modulated filtered pink noise with periodic gusts."""
    base = _pink_noise(n, rng)
    # Low-pass for rumble
    b, a = spsig.butter(2, 400 / (fs / 2), btype="low")
    rumble = spsig.filtfilt(b, a, base) * 0.5
    # Slow AM gust envelope
    t = np.arange(n) / fs
    gust_freq = rng.uniform(0.05, 0.2)
    env = 0.5 + 0.5 * np.sin(2 * np.pi * gust_freq * t + rng.uniform(0, 2 * np.pi))
    env = env ** 2  # sharpen gust peaks
    return rumble * env


def gen_city(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    """City: distant traffic hum + occasional horn-like tonal bursts."""
    base = _pink_noise(n, rng)
    b, a = spsig.butter(2, [80 / (fs / 2), 600 / (fs / 2)], btype="band")
    traffic = spsig.filtfilt(b, a, base) * 0.4
    t = np.arange(n) / fs
    # Periodic honks
    honks = np.zeros(n)
    n_honks = rng.integers(1, 4)
    for _ in range(n_honks):
        start = rng.uniform(0.1, 0.9) * (n / fs)
        dur = rng.uniform(0.3, 0.8)
        freq = rng.uniform(350, 600)
        mask = (t >= start) & (t < start + dur)
        env = np.zeros(n)
        env[mask] = np.hanning(mask.sum())
        honks += 0.15 * np.sin(2 * np.pi * freq * t) * env
    return traffic + honks


def gen_forest(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    """Forest: gentle wind + bird chirps at random intervals."""
    bg = gen_wind(n, rng, fs) * 0.4
    t = np.arange(n) / fs
    chirps = np.zeros(n)
    n_chirps = int(n / fs * rng.uniform(0.5, 2.0))
    for _ in range(n_chirps):
        start = rng.uniform(0, n / fs - 0.3)
        dur = rng.uniform(0.05, 0.25)
        freq = rng.uniform(2000, 6000)
        sweep = rng.uniform(-500, 500)
        mask = (t >= start) & (t < start + dur)
        if not mask.any():
            continue
        env = np.hanning(mask.sum())
        fq = freq + sweep * (t[mask] - start) / dur
        chirps[mask] += 0.12 * np.sin(2 * np.pi * fq * t[mask]) * env
    return bg + chirps


def gen_electronic(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    """Electronic: 50Hz hum + harmonics + subtle modulation."""
    t = np.arange(n) / fs
    hum_freq = rng.choice([50.0, 60.0])
    hum = sum(
        (0.3 / k) * np.sin(2 * np.pi * hum_freq * k * t + rng.uniform(0, 0.1))
        for k in range(1, 6)
    )
    # Slow LFO modulation
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t)
    noise = rng.standard_normal(n) * 0.02
    return hum * lfo + noise


def gen_white_noise(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    return rng.standard_normal(n)


def gen_silence(n: int, rng: np.random.Generator, fs: int) -> np.ndarray:
    return np.zeros(n)


_GENERATORS = {
    "rain": gen_rain, "wind": gen_wind, "city": gen_city,
    "forest": gen_forest, "electronic": gen_electronic,
    "white_noise": gen_white_noise, "silence": gen_silence,
}


def generate_ambient(
    category: str,
    duration_s: float,
    out_path: str,
    *,
    volume: float = 1.0,
    seed: int = 0,
    fs: int = FS,
) -> str:
    """Generate an ambient WAV file. Returns out_path."""
    rng = np.random.default_rng(seed)
    n = int(duration_s * fs)
    gen = _GENERATORS.get(category, gen_white_noise)
    arr = gen(n, rng, fs)
    # Normalize then apply volume
    peak = np.abs(arr).max()
    if peak > 0:
        arr = arr / peak
    arr = arr * volume
    save_wav(arr, out_path, fs=fs)
    return out_path
