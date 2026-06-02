(function () {
  const supportedPhotos = (window.GRADUATION_PHOTOS || []).filter((photo) =>
    /\.(jpe?g|png|heic)$/i.test(photo.path)
  );
  const unsupportedCount = (window.GRADUATION_PHOTOS || []).length - supportedPhotos.length;

  const state = {
    allPhotos: supportedPhotos,
    filteredPhotos: supportedPhotos,
    activeFolder: "全部",
    index: 0,
    playing: true,
    intervalMs: 4000,
    timer: null,
  };

  const elements = {
    mainPhoto: document.getElementById("mainPhoto"),
    currentIndex: document.getElementById("currentIndex"),
    totalCount: document.getElementById("totalCount"),
    photoFolder: document.getElementById("photoFolder"),
    photoName: document.getElementById("photoName"),
    folderFilters: document.getElementById("folderFilters"),
    thumbGrid: document.getElementById("thumbGrid"),
    playPauseButton: document.getElementById("playPauseButton"),
    shuffleButton: document.getElementById("shuffleButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    speedSelect: document.getElementById("speedSelect"),
    unsupportedNotice: document.getElementById("unsupportedNotice"),
  };

  function encodePhotoPath(path) {
    return path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
  }

  function getFolders() {
    const folders = new Set(state.allPhotos.map((photo) => photo.folder));
    return ["全部", ...Array.from(folders).sort((a, b) => a.localeCompare(b, "zh-Hant"))];
  }

  function setTimer() {
    window.clearInterval(state.timer);
    state.timer = null;
    if (state.playing && state.filteredPhotos.length > 1) {
      state.timer = window.setInterval(() => showPhoto(state.index + 1), state.intervalMs);
    }
  }

  function showPhoto(nextIndex) {
    if (!state.filteredPhotos.length) {
      elements.mainPhoto.removeAttribute("src");
      elements.photoFolder.textContent = "沒有照片";
      elements.photoName.textContent = "目前分類沒有可顯示的照片";
      elements.currentIndex.textContent = "0";
      elements.totalCount.textContent = "0";
      return;
    }

    state.index = (nextIndex + state.filteredPhotos.length) % state.filteredPhotos.length;
    const photo = state.filteredPhotos[state.index];
    elements.mainPhoto.classList.add("is-changing");

    window.setTimeout(() => {
      const encodedPath = encodePhotoPath(photo.path);
      elements.mainPhoto.src = encodedPath;
      elements.mainPhoto.alt = `${photo.folder} - ${photo.name}`;
      elements.photoFolder.textContent = photo.folder;
      elements.photoName.textContent = photo.name;
      elements.currentIndex.textContent = String(state.index + 1);
      elements.totalCount.textContent = String(state.filteredPhotos.length);
      updateActiveThumb();
      elements.mainPhoto.classList.remove("is-changing");

      elements.mainPhoto.onerror = () => {
        console.error(`圖片加載失敗: ${encodedPath}`, photo);
        elements.photoName.textContent = `${photo.name} (加載失敗)`;
      };
    }, 120);
  }

  function renderFilters() {
    elements.folderFilters.innerHTML = "";
    getFolders().forEach((folder) => {
      const button = document.createElement("button");
      const count = folder === "全部"
        ? state.allPhotos.length
        : state.allPhotos.filter((photo) => photo.folder === folder).length;
      button.type = "button";
      button.textContent = `${folder} ${count}`;
      button.className = folder === state.activeFolder ? "is-active" : "";
      button.addEventListener("click", () => {
        state.activeFolder = folder;
        state.filteredPhotos = folder === "全部"
          ? state.allPhotos
          : state.allPhotos.filter((photo) => photo.folder === folder);
        state.index = 0;
        renderFilters();
        renderThumbs();
        showPhoto(0);
        setTimer();
      });
      elements.folderFilters.appendChild(button);
    });
  }

  function renderThumbs() {
    elements.thumbGrid.innerHTML = "";
    if (!state.filteredPhotos.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "這個分類沒有照片。";
      elements.thumbGrid.appendChild(empty);
      return;
    }

    state.filteredPhotos.forEach((photo, index) => {
      const button = document.createElement("button");
      const image = document.createElement("img");
      button.type = "button";
      button.className = "thumb";
      button.title = photo.name;
      image.loading = "lazy";
      image.src = encodePhotoPath(photo.path);
      image.alt = photo.name;
      button.appendChild(image);
      button.addEventListener("click", () => {
        showPhoto(index);
        setTimer();
      });
      elements.thumbGrid.appendChild(button);
    });
    updateActiveThumb();
  }

  function updateActiveThumb() {
    Array.from(elements.thumbGrid.children).forEach((child, index) => {
      child.classList.toggle("is-active", index === state.index);
    });
    const activeThumb = elements.thumbGrid.children[state.index];
    if (activeThumb) {
      const container = elements.thumbGrid;
      const thumbRect = activeThumb.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const isVisible = thumbRect.left >= containerRect.left && thumbRect.right <= containerRect.right;

      if (!isVisible) {
        const scrollAmount = thumbRect.left - containerRect.left - (containerRect.width / 2) + (thumbRect.width / 2);
        container.scrollLeft += scrollAmount;
      }
    }
  }

  function shuffleCurrentPhotos() {
    for (let i = state.filteredPhotos.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.filteredPhotos[i], state.filteredPhotos[j]] = [state.filteredPhotos[j], state.filteredPhotos[i]];
    }
    state.index = 0;
    renderThumbs();
    showPhoto(0);
    setTimer();
  }

  elements.prevButton = document.getElementById("prevButton");
  elements.nextButton = document.getElementById("nextButton");
  elements.prevButton.addEventListener("click", () => {
    showPhoto(state.index - 1);
    setTimer();
  });
  elements.nextButton.addEventListener("click", () => {
    showPhoto(state.index + 1);
    setTimer();
  });
  elements.playPauseButton.addEventListener("click", () => {
    state.playing = !state.playing;
    elements.playPauseButton.textContent = state.playing ? "暫停" : "播放";
    setTimer();
  });
  elements.shuffleButton.addEventListener("click", shuffleCurrentPhotos);
  elements.fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  elements.speedSelect.addEventListener("change", (event) => {
    state.intervalMs = Number(event.target.value);
    setTimer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(state.index - 1);
    if (event.key === "ArrowRight") showPhoto(state.index + 1);
    if (event.key === " ") {
      event.preventDefault();
      elements.playPauseButton.click();
    }
  });

  elements.unsupportedNotice.textContent = unsupportedCount
    ? `${unsupportedCount} 張 HEIC 未列入網頁輪播`
    : "";

  renderFilters();
  renderThumbs();
  showPhoto(0);
  setTimer();
})();
