// script.js - Windows XP Portfolio Logic with GSAP

document.addEventListener('DOMContentLoaded', () => {
  
  // Elements
  const bootScreen = document.getElementById('boot-screen');
  const loginScreen = document.getElementById('login-screen');
  const loginUser = document.getElementById('login-user');
  const desktopEnv = document.getElementById('desktop');
  const taskbar = document.querySelector('.taskbar');
  
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const clockEl = document.getElementById('clock');
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  const windows = document.querySelectorAll('.xp-window');
  const taskbarApps = document.getElementById('taskbar-apps');
  const startItems = document.querySelectorAll('.start-item[data-window]');

  // --- Audio ---
  const startupSound = new Audio('assets/sounds/startup.mp3');
  const clickSound = new Audio('assets/sounds/click.wav'); // Optional: user can add click.wav

  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => {}); // Ignore if file missing or autoplay blocked
  }

  // Play click sound on interactive elements
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, .desktop-icon, .start-item, .taskbar-tab, .xp-panel-content a')) {
      playClick();
    }
  });

  let highestZIndex = 10;
  let isStartMenuOpen = false;
  let wasDragging = false;

  // --- Boot and Login Sequence ---
  // Hide desktop and taskbar initially
  desktopEnv.style.display = 'none';
  taskbar.style.display = 'none';

  setTimeout(() => {
    // Show login screen behind boot screen before fading
    loginScreen.style.display = 'flex';
    loginScreen.style.opacity = 1;

    gsap.to(bootScreen, { 
      opacity: 0, 
      duration: 0.5, 
      onComplete: () => {
        bootScreen.style.display = 'none';
      }
    });
  }, 3000);

  const welcomeMessage = document.getElementById('welcome-message');
  const loginMiddle = document.querySelector('.login-middle');
  const loginBottom = document.querySelector('.login-bottom');

  loginUser.addEventListener('click', () => {
    // 1. Fade out the login selection UI
    gsap.to([loginMiddle, loginBottom], {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        loginMiddle.style.display = 'none';
        loginBottom.style.display = 'none';
        
        // 2. Fade in the Welcome message
        welcomeMessage.style.display = 'block';
        gsap.fromTo(welcomeMessage, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        
        // Play startup sound during the Welcome screen
        startupSound.play().catch(e => console.log('Autoplay blocked or file missing:', e));

        // 3. Wait 2 seconds, then fade out the whole screen and show desktop
        setTimeout(() => {
          gsap.to(loginScreen, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              loginScreen.style.display = 'none';
              desktopEnv.style.display = 'flex';
              taskbar.style.display = 'flex';
              gsap.fromTo(".desktop-icon", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 });
              
              // Balloon Logic
              setTimeout(() => {
                const balloon = document.getElementById('xp-balloon');
                if (balloon) {
                  balloon.style.display = 'block';
                  gsap.fromTo(balloon, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
                  
                  // Auto-close after 5 seconds
                  setTimeout(() => {
                    if (balloon.style.display !== 'none') {
                      gsap.to(balloon, { opacity: 0, duration: 0.3, onComplete: () => balloon.style.display = 'none' });
                    }
                  }, 5000);
                }
              }, 2000);
            }
          });
        }, 2000);
      }
    });
  });

  // --- Clock Logic ---
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- Start Menu Toggle ---
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isStartMenuOpen) {
      closeStartMenu();
    } else {
      isStartMenuOpen = true;
      startMenu.style.display = 'flex';
      gsap.fromTo(startMenu, 
        { opacity: 0, scale: 0.8, y: 20 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  });

  document.addEventListener('click', (e) => {
    if (isStartMenuOpen && !startMenu.contains(e.target) && e.target !== startBtn) {
      closeStartMenu();
    }
    
    // Deselect icons if clicking outside
    if (!e.target.closest('.desktop-icon') && !wasDragging) {
      desktopIcons.forEach(icon => icon.classList.remove('selected'));
    }
    
    // Reset wasDragging after click has been processed
    wasDragging = false;
  });

  function closeStartMenu() {
    if (!isStartMenuOpen) return;
    isStartMenuOpen = false;
    gsap.to(startMenu, { 
      opacity: 0, scale: 0.9, y: 10, duration: 0.15, 
      onComplete: () => { startMenu.style.display = 'none'; } 
    });
  }

  // --- Window Management ---
  
  // Bring to front
  function bringToFront(win) {
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateTaskbarFocus(win.id);
  }

  // Open Window
  function openWindow(windowId, triggerEl) {
    const win = document.getElementById(windowId);
    if (!win) return;
    
    if (win.style.display === 'none') {
      win.style.display = 'flex';
      bringToFront(win);
      
      // Animation origin (either icon or center)
      let origin = { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 };
      if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect();
        origin = { x: rect.left, y: rect.top };
      }
      
      gsap.fromTo(win, 
        { opacity: 0, scale: 0.5, left: origin.x, top: origin.y },
        { opacity: 1, scale: 1, left: window.innerWidth / 2 - 200, top: 100, duration: 0.3, ease: "back.out(1.2)" }
      );
      
      createTaskbarTab(windowId);
    } else {
      // If already open but minimized or behind
      bringToFront(win);
      gsap.to(win, { opacity: 1, scale: 1, duration: 0.2 });
    }
    closeStartMenu();
  }

  // Close Window
  function closeWindow(win) {
    const mediaElements = win.querySelectorAll('video, audio');
    mediaElements.forEach(media => {
      if (!media.paused) media.pause();
    });
    
    if (win.id === 'window-mediaplayer') {
      const playBtn = win.querySelector('#wmp-play-btn');
      if (playBtn) playBtn.textContent = 'â–¶';
    }

    gsap.to(win, { 
      opacity: 0, scale: 0.8, duration: 0.2, 
      onComplete: () => { 
        win.style.display = 'none'; 
        win.classList.remove('minimized');
        removeTaskbarTab(win.id);
      } 
    });
  }

  // Minimize Window
  function minimizeWindow(win) {
    gsap.to(win, { 
      opacity: 0, scale: 0.8, duration: 0.2, 
      onComplete: () => { 
        win.style.display = 'none'; 
        win.classList.add('minimized');
        updateTaskbarFocus(null);
      } 
    });
  }

  // Maximize Window
  function toggleMaximize(win) {
    const isMaximized = win.classList.contains('maximized');
    const draggable = Draggable.get(win);
    
    if (isMaximized) {
      win.classList.remove('maximized');
      if (draggable) draggable.enable();
    } else {
      win.classList.add('maximized');
      if (draggable) draggable.disable();
    }
  }

  // --- Interactions ---

  // Desktop Icons
  desktopIcons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!wasDragging) {
        desktopIcons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      }
    });
    
    icon.addEventListener('dblclick', () => {
      const windowId = icon.getAttribute('data-window');
      openWindow(windowId, icon);
    });
  });
  
  // Start Menu Items
  startItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const windowId = item.getAttribute('data-window');
      if (windowId) openWindow(windowId, startBtn);
    });
  });

  // Window Controls & Focus
  windows.forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
    
    const closeBtn = win.querySelector('.close-btn');
    const minimizeBtn = win.querySelector('button[aria-label="Minimize"]');
    const maximizeBtn = win.querySelector('button[aria-label="Maximize"]');
    const titleBar = win.querySelector('.title-bar');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(win);
      });
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(win);
      });
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMaximize(win);
      });
    }

    if (titleBar) {
      titleBar.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        toggleMaximize(win);
      });
    }
  });

  // --- Taskbar Tabs ---
  function createTaskbarTab(windowId) {
    if (document.getElementById(`tab-${windowId}`)) return;
    
    const win = document.getElementById(windowId);
    const title = win.querySelector('.title-bar-text').textContent.trim();
    
    const tab = document.createElement('div');
    tab.className = 'taskbar-tab active';
    tab.id = `tab-${windowId}`;
    tab.textContent = title;
    
    tab.addEventListener('click', () => {
      if (win.style.display === 'none' || win.style.opacity == 0 || win.classList.contains('minimized')) {
        win.style.display = 'flex';
        win.classList.remove('minimized');
        gsap.to(win, { opacity: 1, scale: 1, duration: 0.2 });
        bringToFront(win);
      } else if (win.style.zIndex == highestZIndex) {
        // Minimize
        minimizeWindow(win);
        tab.classList.remove('active');
      } else {
        bringToFront(win);
      }
    });
    
    taskbarApps.appendChild(tab);
    updateTaskbarFocus(windowId);
  }

  function removeTaskbarTab(windowId) {
    const tab = document.getElementById(`tab-${windowId}`);
    if (tab) tab.remove();
  }

  function updateTaskbarFocus(activeWindowId) {
    document.querySelectorAll('.taskbar-tab').forEach(tab => {
      if (tab.id === `tab-${activeWindowId}`) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // --- GSAP Draggable ---
  // --- GSAP Draggable ---
  document.querySelectorAll(".xp-window").forEach(win => {
    Draggable.create(win, {
      bounds: ".desktop",
      handle: win.querySelector(".title-bar"),
      edgeResistance: 0.65,
      onPress: function(e) {
        e.stopPropagation();
        bringToFront(this.target);
      }
    });
  });

  // Make desktop icons draggable
  Draggable.create(".desktop-icon", {
    bounds: ".desktop",
    edgeResistance: 0.65,
    onPress: function(e) {
      if (!this.target.classList.contains('selected')) {
        desktopIcons.forEach(i => i.classList.remove('selected'));
        this.target.classList.add('selected');
      }
    },
    onDrag: function() {
      const dx = this.deltaX;
      const dy = this.deltaY;
      desktopIcons.forEach(icon => {
        if (icon !== this.target && icon.classList.contains('selected')) {
          gsap.set(icon, { x: "+=" + dx, y: "+=" + dy });
        }
      });
    }
  });

  // --- Marquee Selection ---
  let isSelecting = false;
  let startX, startY;
  const selectionBox = document.createElement('div');
  selectionBox.classList.add('selection-box');
  
  desktopEnv.addEventListener('mousedown', (e) => {
    // Only start selection if clicking directly on the desktop
    if (e.target === desktopEnv || e.target.classList.contains('desktop-icons')) {
      isSelecting = true;
      wasDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      document.body.appendChild(selectionBox);
      
      // Clear current selections
      desktopIcons.forEach(icon => icon.classList.remove('selected'));
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Mark as dragging if moved beyond a tiny threshold
    if (Math.abs(currentX - startX) > 2 || Math.abs(currentY - startY) > 2) {
      wasDragging = true;
    }
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);
    
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    
    // Check intersection with icons
    const boxRect = selectionBox.getBoundingClientRect();
    desktopIcons.forEach(icon => {
      const iconRect = icon.getBoundingClientRect();
      const isIntersecting = !(
        boxRect.right < iconRect.left || 
        boxRect.left > iconRect.right || 
        boxRect.bottom < iconRect.top || 
        boxRect.top > iconRect.bottom
      );
      if (isIntersecting) {
        icon.classList.add('selected');
      } else {
        icon.classList.remove('selected');
      }
    });
  });

  window.addEventListener('mouseup', () => {
    if (isSelecting) {
      isSelecting = false;
      if (selectionBox.parentNode) {
        selectionBox.parentNode.removeChild(selectionBox);
      }
    }
  });

  // --- Paint App Logic ---
  const canvas = document.getElementById('paint-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const clearBtn = document.getElementById('paint-clear');
    
    let isDrawing = false;
    let currentColor = 'black';
    
    // Set default swatch active
    const defaultSwatch = document.querySelector('.color-swatch[data-color="black"]');
    if (defaultSwatch) defaultSwatch.classList.add('active');
    
    // Basic Canvas Setup
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    
    // Color selection
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.getAttribute('data-color');
        ctx.strokeStyle = currentColor;
      });
    });
    
    // Clear canvas
    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    // Drawing handlers
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (isDrawing) {
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });
    canvas.addEventListener('mouseout', () => {
      isDrawing = false;
    });
  }

  // --- Context Menus ---
  const desktopMenu = document.getElementById('desktop-menu');
  const iconMenu = document.getElementById('icon-menu');
  const taskbarMenu = document.getElementById('taskbar-menu');
  const allMenus = [desktopMenu, iconMenu, taskbarMenu];

  function hideAllMenus() {
    allMenus.forEach(menu => {
      if (menu) menu.style.display = 'none';
    });
  }

  window.fakeRefresh = function() {
    hideAllMenus();
    const iconsContainer = document.querySelector('.desktop-icons');
    if (iconsContainer) {
      iconsContainer.style.visibility = 'hidden';
      setTimeout(() => {
        iconsContainer.style.visibility = 'visible';
      }, 150);
    }
  };

  const resetIconsBtn = document.getElementById('reset-icons-btn');
  if (resetIconsBtn) {
    resetIconsBtn.addEventListener('click', () => {
      desktopIcons.forEach(icon => {
        gsap.set(icon, { x: 0, y: 0, clearProps: "x,y,transform" });
        icon.style.transform = '';
      });
      hideAllMenus();
    });
  }

  document.addEventListener('contextmenu', (e) => {
    // Prevent default context menu everywhere
    e.preventDefault();
    hideAllMenus();

    let targetMenu = null;

    if (e.target.closest('.desktop-icon')) {
      targetMenu = iconMenu;
      
      // Select the icon being right-clicked
      desktopIcons.forEach(i => i.classList.remove('selected'));
      e.target.closest('.desktop-icon').classList.add('selected');
    } else if (e.target.closest('.taskbar')) {
      targetMenu = taskbarMenu;
    } else if (e.target === desktopEnv || e.target.classList.contains('desktop-icons')) {
      targetMenu = desktopMenu;
    }

    if (targetMenu) {
      targetMenu.style.display = 'flex';
      
      // Keep menu within viewport bounds
      const menuRect = targetMenu.getBoundingClientRect();
      let x = e.clientX;
      let y = e.clientY;
      
      if (x + menuRect.width > window.innerWidth) {
        x -= menuRect.width;
      }
      if (y + menuRect.height > window.innerHeight) {
        y -= menuRect.height;
      }

      targetMenu.style.left = x + 'px';
      targetMenu.style.top = y + 'px';
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      hideAllMenus();
    }
  });

  // --- Balloon Close Logic ---
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('balloon-close')) {
      const balloon = e.target.closest('.xp-balloon');
      gsap.to(balloon, { opacity: 0, duration: 0.3, onComplete: () => balloon.style.display = 'none' });
    }
  });

  // --- Calendar Widget Logic ---
  const calendarWidget = document.getElementById('xp-calendar');
  const calGrid = document.getElementById('cal-grid');
  const calMonthYear = document.getElementById('cal-month-year');
  const clockContainer = document.getElementById('clock'); // Note: 'clock' ID must exist on the taskbar clock

  if(clockContainer) {
    clockContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (calendarWidget.style.display === 'none') {
        const now = new Date();
        calMonthYear.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        calGrid.innerHTML = '';
        for (let i = 0; i < firstDay; i++) {
          const emptySpan = document.createElement('span');
          calGrid.appendChild(emptySpan);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
          const daySpan = document.createElement('span');
          daySpan.textContent = i;
          if (i === now.getDate()) {
            daySpan.classList.add('today');
          }
          calGrid.appendChild(daySpan);
        }
        
        calendarWidget.style.display = 'block';
      } else {
        calendarWidget.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (calendarWidget && !e.target.closest('#xp-calendar') && e.target !== clockContainer) {
        calendarWidget.style.display = 'none';
      }
    });
  }

  // --- Minesweeper App Logic ---
  const msGrid = document.getElementById('ms-grid');
  const msFace = document.getElementById('ms-face');
  const msMinesCount = document.getElementById('ms-mines-count');
  
  if (msGrid) {
    let board = [];
    const rows = 9;
    const cols = 9;
    const totalMines = 10;
    let minesLeft = totalMines;
    let gameOver = false;
    let firstClick = true;
    
    function initMinesweeper() {
      board = Array.from({length: rows}, () => Array(cols).fill({ mine: false, revealed: false, flagged: false, count: 0 }));
      msGrid.innerHTML = '';
      gameOver = false;
      firstClick = true;
      minesLeft = totalMines;
      msMinesCount.textContent = minesLeft.toString().padStart(3, '0');
      msFace.textContent = 'ðŸ™‚';
      
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          const cell = document.createElement('div');
          cell.classList.add('ms-cell');
          cell.dataset.r = r;
          cell.dataset.c = c;
          
          cell.addEventListener('mousedown', handleMsClick);
          cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleMsRightClick(r, c, cell); });
          msGrid.appendChild(cell);
        }
      }
    }
    
    function placeMines(firstR, firstC) {
      let minesPlaced = 0;
      while(minesPlaced < totalMines) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if(!board[r][c].mine && !(r === firstR && c === firstC)) {
          board[r][c] = { ...board[r][c], mine: true };
          minesPlaced++;
        }
      }
      
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          if(!board[r][c].mine) {
            let count = 0;
            for(let dr=-1; dr<=1; dr++) {
              for(let dc=-1; dc<=1; dc++) {
                let nr = r+dr, nc = c+dc;
                if(nr>=0 && nr<rows && nc>=0 && nc<cols && board[nr][nc].mine) count++;
              }
            }
            board[r][c] = { ...board[r][c], count };
          }
        }
      }
    }
    
    function handleMsClick(e) {
      if(gameOver) return;
      if (e.button !== 0) return; 
      
      let r = parseInt(e.target.dataset.r);
      let c = parseInt(e.target.dataset.c);
      
      if(board[r][c].flagged || board[r][c].revealed) return;
      
      if(firstClick) {
        placeMines(r, c);
        firstClick = false;
      }
      
      if(board[r][c].mine) {
        gameOver = true;
        msFace.textContent = 'ðŸ˜µ';
        revealAll();
      } else {
        revealCell(r, c);
        checkWin();
      }
    }
    
    function handleMsRightClick(r, c, cell) {
      if(gameOver || board[r][c].revealed) return;
      board[r][c].flagged = !board[r][c].flagged;
      cell.textContent = board[r][c].flagged ? 'ðŸš©' : '';
      minesLeft += board[r][c].flagged ? -1 : 1;
      msMinesCount.textContent = minesLeft.toString().padStart(3, '0');
    }
    
    function revealCell(r, c) {
      if(r<0 || r>=rows || c<0 || c>=cols || board[r][c].revealed || board[r][c].flagged) return;
      board[r][c].revealed = true;
      const cell = msGrid.children[r * cols + c];
      cell.classList.add('revealed');
      
      if(board[r][c].count > 0) {
        cell.textContent = board[r][c].count;
        cell.classList.add(`ms-${board[r][c].count}`);
      } else {
        for(let dr=-1; dr<=1; dr++) {
          for(let dc=-1; dc<=1; dc++) {
            revealCell(r+dr, c+dc);
          }
        }
      }
    }
    
    function revealAll() {
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          const cell = msGrid.children[r * cols + c];
          if(board[r][c].mine) {
            cell.classList.add('revealed', 'mine');
            cell.textContent = 'ðŸ’£';
          }
        }
      }
    }
    
    function checkWin() {
      let unrevealedSafe = 0;
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          if(!board[r][c].mine && !board[r][c].revealed) unrevealedSafe++;
        }
      }
      if(unrevealedSafe === 0) {
        gameOver = true;
        msFace.textContent = 'ðŸ˜Ž';
      }
    }
    
    msFace.addEventListener('click', initMinesweeper);
    initMinesweeper();
  }

  // --- Sidebar Panel Toggle ---
  document.querySelectorAll('.xp-panel-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const content = header.nextElementSibling;
      if (content && content.classList.contains('xp-panel-content')) {
        // We use GSAP to animate height, opacity and padding
        // Check if currently collapsed or in the process of collapsing
        const isCollapsed = content.style.display === 'none' || content.style.height === '0px';
        
        if (isCollapsed) {
          content.style.display = 'flex';
          gsap.fromTo(content, 
            { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }, 
            { height: 'auto', opacity: 1, paddingTop: 10, paddingBottom: 10, duration: 0.3, ease: 'power2.out' }
          );
        } else {
          gsap.to(content, { 
            height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden', duration: 0.3, ease: 'power2.in', 
            onComplete: () => {
              content.style.display = 'none';
              content.style.height = 'auto'; // Reset for next open
              content.style.paddingTop = '10px';
              content.style.paddingBottom = '10px';
            }
          });
        }
        
        const toggleIcon = header.querySelector('span');
        if (toggleIcon) {
          toggleIcon.textContent = isCollapsed ? 'â–²' : 'â–¼';
        }
      }
    });
  });

  // --- Windows Media Player Logic ---
  const wmpVideo = document.getElementById('wmp-video');
  const wmpPlayBtn = document.getElementById('wmp-play-btn');
  const wmpSeek = document.getElementById('wmp-seek');
  const wmpCurrentTime = document.getElementById('wmp-current-time');
  const wmpDuration = document.getElementById('wmp-duration');
  const wmpPlaylistItems = document.querySelectorAll('.wmp-item');

  if (wmpVideo) {
    // Format time helpers
    const formatTime = (time) => {
      const min = Math.floor(time / 60) || 0;
      const sec = Math.floor(time % 60) || 0;
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // Play/Pause
    wmpPlayBtn.addEventListener('click', () => {
      if (wmpVideo.paused) {
        wmpVideo.play();
        wmpPlayBtn.textContent = 'â¸';
      } else {
        wmpVideo.pause();
        wmpPlayBtn.textContent = 'â–¶';
      }
    });

    // Update timeline
    wmpVideo.addEventListener('timeupdate', () => {
      if (!isNaN(wmpVideo.duration)) {
        wmpSeek.value = (wmpVideo.currentTime / wmpVideo.duration) * 100;
        wmpCurrentTime.textContent = formatTime(wmpVideo.currentTime);
      }
    });

    wmpVideo.addEventListener('loadedmetadata', () => {
      wmpDuration.textContent = formatTime(wmpVideo.duration);
    });

    // Seek
    wmpSeek.addEventListener('input', () => {
      if (!isNaN(wmpVideo.duration)) {
        wmpVideo.currentTime = (wmpSeek.value / 100) * wmpVideo.duration;
      }
    });

    // Playlist click
    wmpPlaylistItems.forEach(item => {
      item.addEventListener('click', () => {
        wmpPlaylistItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const src = item.getAttribute('data-src');
        if (src) {
          wmpVideo.src = src;
          wmpVideo.play().catch(e => console.log('Autoplay blocked:', e));
          wmpPlayBtn.textContent = 'â¸';
        }
      });
    });
    
    // Load first item automatically if available
    const firstActive = document.querySelector('.wmp-item.active');
    if (firstActive && firstActive.getAttribute('data-src')) {
      wmpVideo.src = firstActive.getAttribute('data-src');
    }
  }

  // --- Turn Off Computer Dialog Logic ---
  const turnOffOverlay = document.getElementById('turn-off-overlay');
  const turnOffDialog = document.getElementById('turn-off-dialog');
  const loginTurnOffBtn = document.getElementById('login-turn-off-btn');
  const startTurnOffBtn = document.getElementById('start-turn-off-btn');
  const turnOffCancel = document.getElementById('turn-off-cancel');

  function showTurnOffDialog() {
    if (isStartMenuOpen) closeStartMenu();
    turnOffOverlay.style.display = 'block';
    turnOffDialog.style.display = 'flex';
    gsap.fromTo(turnOffOverlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(turnOffDialog, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.2)' });
  }

  function hideTurnOffDialog() {
    gsap.to(turnOffDialog, { opacity: 0, scale: 0.8, duration: 0.2 });
    gsap.to(turnOffOverlay, { opacity: 0, duration: 0.2, onComplete: () => {
      turnOffOverlay.style.display = 'none';
      turnOffDialog.style.display = 'none';
    }});
  }

  if (loginTurnOffBtn) loginTurnOffBtn.addEventListener('click', showTurnOffDialog);
  if (startTurnOffBtn) startTurnOffBtn.addEventListener('click', showTurnOffDialog);
  if (turnOffCancel) turnOffCancel.addEventListener('click', hideTurnOffDialog);

  // Close when clicking overlay
  if (turnOffOverlay) turnOffOverlay.addEventListener('click', hideTurnOffDialog);

  // --- Log Off Logic ---
  const startLogOffBtn = document.getElementById('start-log-off-btn');
  if (startLogOffBtn) {
    startLogOffBtn.addEventListener('click', () => {
      closeStartMenu();
      
      // Optional: Close all open apps
      windows.forEach(win => {
        if (win.id !== 'link-dialog' && win.id !== 'turn-off-dialog') {
          win.style.display = 'none';
          win.classList.remove('minimized', 'maximized');
          removeTaskbarTab(win.id);
        }
      });
      
      gsap.to([desktopEnv, taskbar], {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          desktopEnv.style.display = 'none';
          taskbar.style.display = 'none';
          
          desktopEnv.style.opacity = 1;
          taskbar.style.opacity = 1;
          
          loginMiddle.style.display = '';
          loginBottom.style.display = '';
          loginMiddle.style.opacity = 1;
          loginBottom.style.opacity = 1;
          
          welcomeMessage.style.display = 'none';
          welcomeMessage.style.opacity = 0;
          
          loginScreen.style.display = 'flex';
          gsap.fromTo(loginScreen, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        }
      });
    });
  }

  // --- Link Confirmation Dialog Logic ---
  const linkOverlay = document.getElementById('link-dialog-overlay');
  const linkDialog = document.getElementById('link-dialog');
  const linkIcon = document.getElementById('link-dialog-icon');
  const linkText = document.getElementById('link-dialog-text');
  const btnCancel = document.getElementById('link-dialog-cancel');
  const btnConfirm = document.getElementById('link-dialog-confirm');
  const btnClose = document.getElementById('link-dialog-close');
  
  let currentLinkHref = '';

  function showLinkDialog(href, name, iconSrc) {
    currentLinkHref = href;
    linkIcon.src = iconSrc || 'assets/icons/Internet Shortcut.png';
    linkText.textContent = `Are you sure you want to open '${name}'?`;
    btnConfirm.textContent = `Visit ${name}`;
    
    linkOverlay.style.display = 'block';
    linkDialog.style.display = 'flex';
    
    // Position dialog in center
    gsap.fromTo(linkDialog, 
      { opacity: 0, scale: 0.9, top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 175 },
      { opacity: 1, scale: 1, duration: 0.2 }
    );
  }

  function hideLinkDialog() {
    gsap.to(linkDialog, { opacity: 0, scale: 0.9, duration: 0.15, onComplete: () => {
      linkDialog.style.display = 'none';
      linkOverlay.style.display = 'none';
    }});
  }

  // Intercept external links
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.href;
      const text = link.textContent.trim();
      const img = link.querySelector('img');
      const iconSrc = img ? img.src : null;
      showLinkDialog(href, text, iconSrc);
    });
  });

  if (btnCancel) btnCancel.addEventListener('click', hideLinkDialog);
  if (btnClose) btnClose.addEventListener('click', hideLinkDialog);
  if (linkOverlay) linkOverlay.addEventListener('click', hideLinkDialog);
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      hideLinkDialog();
      window.open(currentLinkHref, '_blank');
    });
  }

  // Make dialog draggable
  if (linkDialog) {
    Draggable.create(linkDialog, {
      bounds: "body",
      handle: ".title-bar",
      edgeResistance: 0.65
    });
  }

  // --- Custom Zoom for Desktop Icons ---
  let iconScale = 1;

  function updateIconZoom() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
      icon.style.width = `${70 * iconScale}px`;
      const img = icon.querySelector('img');
      if (img) {
        img.style.width = `${32 * iconScale}px`;
        img.style.height = `${32 * iconScale}px`;
      }
      const span = icon.querySelector('span');
      if (span) {
        span.style.fontSize = `${11 * iconScale}px`;
      }
    });
  }

  // Prevent default browser zoom and scale icons instead
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        iconScale = Math.min(iconScale + 0.1, 3); // Zoom in
      } else {
        iconScale = Math.max(iconScale - 0.1, 0.5); // Zoom out
      }
      updateIconZoom();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
      if (e.key === '=' || e.key === '+' || e.key === 'Add') {
        e.preventDefault();
        iconScale = Math.min(iconScale + 0.1, 3);
        updateIconZoom();
      } else if (e.key === '-' || e.key === '_' || e.key === 'Subtract') {
        e.preventDefault();
        iconScale = Math.max(iconScale - 0.1, 0.5);
        updateIconZoom();
      } else if (e.key === '0') {
        e.preventDefault();
        iconScale = 1;
        updateIconZoom();
      }
    }
  });

});

