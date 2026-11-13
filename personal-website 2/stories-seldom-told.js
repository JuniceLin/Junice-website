const memoryAudio = document.getElementById('memory-audio');
const memoryPlay = document.getElementById('memory-play');
const memorySeek = document.getElementById('memory-seek');
const memoryCurrent = document.getElementById('memory-current');
const memoryDuration = document.getElementById('memory-duration');
const memoryWaveform = document.getElementById('memory-waveform');

if (memoryAudio && memoryPlay && memorySeek && memoryWaveform) {
  const bars = Array.from({ length: 86 }, (_, index) => {
    const bar = document.createElement('span');
    const swell = Math.abs(Math.sin(index * 0.37) * Math.cos(index * 0.19));
    const pulse = Math.abs(Math.sin(index * 1.71));
    bar.style.setProperty('--bar-height', `${8 + Math.round((swell * .7 + pulse * .3) * 78)}%`);
    memoryWaveform.append(bar);
    return bar;
  });

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  const sync = () => {
    const duration = memoryAudio.duration || 89;
    const fraction = Math.min(1, memoryAudio.currentTime / duration);
    memorySeek.value = String(Math.round(fraction * 1000));
    memoryCurrent.textContent = formatTime(memoryAudio.currentTime);
    if (Number.isFinite(memoryAudio.duration)) memoryDuration.textContent = formatTime(memoryAudio.duration);
    bars.forEach((bar, index) => bar.classList.toggle('heard', index / bars.length <= fraction));
    memoryPlay.innerHTML = memoryAudio.paused ? 'PLAY <span aria-hidden="true">↗</span>' : 'PAUSE <span aria-hidden="true">Ⅱ</span>';
    memoryPlay.setAttribute('aria-label', memoryAudio.paused ? 'Play audio' : 'Pause audio');
  };

  memoryPlay.addEventListener('click', async () => {
    if (memoryAudio.paused) {
      try { await memoryAudio.play(); } catch (_) { memoryPlay.setAttribute('aria-label', 'Audio playback unavailable'); }
    } else {
      memoryAudio.pause();
    }
    sync();
  });
  memorySeek.addEventListener('input', () => {
    if (Number.isFinite(memoryAudio.duration)) memoryAudio.currentTime = Number(memorySeek.value) / 1000 * memoryAudio.duration;
    sync();
  });
  ['loadedmetadata', 'timeupdate', 'play', 'pause', 'ended'].forEach(event => memoryAudio.addEventListener(event, sync));
  sync();
}
