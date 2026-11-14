const videos = [...document.querySelectorAll('video')];
for (const video of videos) {
  video.addEventListener('play', () => {
    for (const other of videos) if (other !== video) other.pause();
  });
  const showError = () => { video.nextElementSibling.hidden = false; };
  video.addEventListener('error', showError);
  for (const source of video.querySelectorAll('source')) source.addEventListener('error', showError);
  video.addEventListener('loadeddata', () => { video.nextElementSibling.hidden = true; });
}
