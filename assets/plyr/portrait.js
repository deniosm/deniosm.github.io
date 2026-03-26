document.addEventListener('DOMContentLoaded', () => {
  const playerContainerMode = document.getElementById('player-container');
  const realFsBtn = document.getElementById('appFullscreenBtn');
  let portraitOverlay = null;

  function createPortraitOverlay() {
    if (portraitOverlay) return;

    if(video) video.pause();

    portraitOverlay = document.createElement('div');
    portraitOverlay.id = 'portrait-overlay';
    portraitOverlay.style.position = 'fixed';
    portraitOverlay.style.top = 0;
    portraitOverlay.style.left = 0;
    portraitOverlay.style.width = '100%';
    portraitOverlay.style.height = '100%';
    portraitOverlay.style.zIndex = 9999;
    portraitOverlay.style.display = 'flex';
    portraitOverlay.style.justifyContent = 'center';
    portraitOverlay.style.alignItems = 'center';
    portraitOverlay.style.flexDirection = 'column';
    portraitOverlay.style.background = 'none';

    const iframe = document.createElement('iframe');
    iframe.src = '/portrait/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    portraitOverlay.appendChild(iframe);
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'tv-controls';

    const fsBtnClone = document.createElement('button');
    fsBtnClone.id = 'portraitFsBtnClone';
    fsBtnClone.className = 'tv-control-btn';
    fsBtnClone.textContent = 'FullScreen';

    fsBtnClone.addEventListener('click', () => {
      realFsBtn.click();
    });

    controlsDiv.appendChild(fsBtnClone);
    portraitOverlay.appendChild(controlsDiv);

    document.body.appendChild(portraitOverlay);
  }

  function removePortraitOverlay() {
    if (portraitOverlay) {
      portraitOverlay.remove();
      portraitOverlay = null;

      if(video) video.play().catch(()=>{});
    }
  }

  function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
      playerContainerMode.classList.add('portraitMode');
      createPortraitOverlay();
      if(video) video.muted = true;
    } else {
      playerContainerMode.classList.remove('portraitMode');
      removePortraitOverlay();
      if(video) video.muted = false;
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);

  checkOrientation();
});
