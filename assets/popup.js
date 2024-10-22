const backgroundColor = localStorage.getItem("ARCONNECT_THEME_BACKGROUND_COLOR");
      
if (backgroundColor) document.documentElement.style.setProperty('--backgroundColor', backgroundColor);