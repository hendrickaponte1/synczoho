const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// The complete widget script - served dynamically
const WIDGET_SCRIPT = `/**
 * TiendaSync - Widget de Entrega Estimada para Tiendanube
 * @version 2.3.1
 * @description Script de inyección para mostrar fechas de entrega estimada en el storefront
 * @updated 2026-01-20 - Fixed geolocation timing issue, now waits for geo before rendering
 */
(function() {
  'use strict';

  var SCRIPT_VERSION = '2.3.1';

  var CONFIG = {
    API_URL: 'https://foatlyiewzihybcolmuy.supabase.co/functions/v1/widget-config',
    GEO_API_URL: 'https://ipapi.co/json/',
    CACHE_KEY: 'tiendasync_config',
    GEO_CACHE_KEY: 'tiendasync_geo',
    CACHE_TTL: 60 * 1000,
    GEO_CACHE_TTL: 30 * 60 * 1000,
    WIDGET_ID: 'tiendasync-delivery-widget',
    DEBUG: false,
    NO_CACHE: false
  };

  if (typeof window !== 'undefined' && window.location && window.location.search) {
    if (window.location.search.indexOf('nocache=1') !== -1) {
      CONFIG.NO_CACHE = true;
      CONFIG.DEBUG = true;
      console.log('[TiendaSync] Modo sin caché activado - Versión:', SCRIPT_VERSION);
    }
  }

  var countdownInterval = null;
  var currentConfig = null;
  var lastRenderedMessage = null;
  var lastReceivedTemplate = null;

  var geoLocation = {
    countryName: null,
    countryCode: null,
    regionName: null,
    city: null,
    source: 'pending'
  };

  function log() {
    if (CONFIG.DEBUG) {
      console.log.apply(console, ['[TiendaSync]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function error() {
    console.error.apply(console, ['[TiendaSync Error]'].concat(Array.prototype.slice.call(arguments)));
  }

  function getLSData() {
    if (typeof LS === 'undefined') {
      log('LS object not found');
      return null;
    }
    return {
      storeId: LS.store && LS.store.id ? String(LS.store.id) : null,
      productId: LS.product && LS.product.id ? String(LS.product.id) : null,
      currency: LS.currency || 'ARS',
      lang: LS.lang || 'es',
      storeCountry: LS.store && LS.store.country_name ? LS.store.country_name : null,
      storeCountryCode: LS.store && LS.store.country ? LS.store.country : null
    };
  }

  var COUNTRY_FLAGS = {
    'AR': '🇦🇷', 'MX': '🇲🇽', 'CO': '🇨🇴', 'CL': '🇨🇱', 'PE': '🇵🇪',
    'EC': '🇪🇨', 'VE': '🇻🇪', 'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴',
    'BR': '🇧🇷', 'CR': '🇨🇷', 'PA': '🇵🇦', 'GT': '🇬🇹', 'SV': '🇸🇻',
    'HN': '🇭🇳', 'NI': '🇳🇮', 'DO': '🇩🇴', 'CU': '🇨🇺', 'PR': '🇵🇷',
    'ES': '🇪🇸', 'US': '🇺🇸', 'PT': '🇵🇹', 'IT': '🇮🇹', 'FR': '🇫🇷',
    'DE': '🇩🇪', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵',
    'CN': '🇨🇳', 'KR': '🇰🇷', 'IN': '🇮🇳', 'RU': '🇷🇺', 'ZA': '🇿🇦'
  };

  function getCountryFlag(countryCode) {
    if (!countryCode) return '🌍';
    var code = countryCode.toUpperCase();
    if (COUNTRY_FLAGS[code]) return COUNTRY_FLAGS[code];
    if (code.length === 2) {
      try {
        return String.fromCodePoint(
          0x1F1E6 + code.charCodeAt(0) - 65,
          0x1F1E6 + code.charCodeAt(1) - 65
        );
      } catch (e) {
        return '🌍';
      }
    }
    return '🌍';
  }

  function getCachedGeo() {
    if (CONFIG.NO_CACHE) return null;
    try {
      var cached = localStorage.getItem(CONFIG.GEO_CACHE_KEY);
      if (!cached) return null;
      var data = JSON.parse(cached);
      if (Date.now() > data.expires) {
        localStorage.removeItem(CONFIG.GEO_CACHE_KEY);
        return null;
      }
      return data.geo;
    } catch (e) {
      return null;
    }
  }

  function setCachedGeo(geo) {
    if (CONFIG.NO_CACHE) return;
    try {
      localStorage.setItem(CONFIG.GEO_CACHE_KEY, JSON.stringify({
        geo: geo,
        expires: Date.now() + CONFIG.GEO_CACHE_TTL
      }));
    } catch (e) {
      log('Geo cache write failed:', e);
    }
  }

  function fetchGeolocation(callback) {
    var cached = getCachedGeo();
    if (cached) {
      log('Using cached geolocation:', cached);
      geoLocation = cached;
      geoLocation.source = 'ip-cached';
      callback(null, cached);
      return;
    }

    log('Fetching geolocation from IP...');
    
    fetch(CONFIG.GEO_API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Geo API HTTP ' + response.status);
      return response.json();
    })
    .then(function(data) {
      log('Geolocation data received:', data);
      var geo = {
        countryName: data.country_name || null,
        countryCode: data.country_code || data.country || null,
        regionName: data.region || data.city || null,
        city: data.city || null,
        source: 'ip'
      };
      geoLocation = geo;
      setCachedGeo(geo);
      callback(null, geo);
    })
    .catch(function(err) {
      error('Geolocation failed:', err);
      applyFallbackGeo();
      callback(err, geoLocation);
    });
  }

  function applyFallbackGeo() {
    var lsData = getLSData();
    if (lsData && lsData.storeCountry) {
      geoLocation = {
        countryName: lsData.storeCountry,
        countryCode: lsData.storeCountryCode,
        regionName: '',
        city: '',
        source: 'fallback'
      };
      log('Applied fallback geolocation from store:', geoLocation);
    } else {
      geoLocation = {
        countryName: 'tu país',
        countryCode: null,
        regionName: '',
        city: '',
        source: 'fallback'
      };
      log('Applied generic fallback geolocation');
    }
  }

  function setupCountrySelector() {
    var selectors = [
      '.js-shipping-country-select',
      'select[name="country"]',
      'select[data-shipping-country]',
      '#shipping-country',
      '.shipping-country-select',
      'select.country-select'
    ];
    
    var selectorElement = null;
    for (var i = 0; i < selectors.length; i++) {
      selectorElement = document.querySelector(selectors[i]);
      if (selectorElement) break;
    }
    
    if (!selectorElement) {
      log('Country selector not found, will retry later');
      setTimeout(setupCountrySelector, 2000);
      return;
    }
    
    log('Found country selector:', selectorElement);
    
    selectorElement.addEventListener('change', function(e) {
      var selectedOption = e.target.options[e.target.selectedIndex];
      var countryName = selectedOption.text || selectedOption.textContent;
      var countryCode = selectedOption.value || selectedOption.getAttribute('data-code');
      
      log('Country changed via selector:', countryName, countryCode);
      
      geoLocation = {
        countryName: countryName,
        countryCode: countryCode,
        regionName: geoLocation.regionName,
        city: geoLocation.city,
        source: 'selector'
      };
      
      if (currentConfig) {
        renderWidget(currentConfig);
      }
    });
    
    setupPostalCodeListener();
  }

  function setupPostalCodeListener() {
    var postalInputs = document.querySelectorAll(
      'input[name="zipcode"], input[name="postal_code"], input[name="zip"], ' +
      '.js-shipping-zipcode, input[data-shipping-zipcode], #shipping-zipcode'
    );
    
    postalInputs.forEach(function(input) {
      var debounceTimer = null;
      input.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          var postalCode = e.target.value.trim();
          if (postalCode.length >= 4) {
            log('Postal code entered:', postalCode);
            if (currentConfig) {
              renderWidget(currentConfig);
            }
          }
        }, 500);
      });
    });
  }

  function setupMutationObserver() {
    if (typeof MutationObserver === 'undefined') return;
    
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          var selector = document.querySelector('.js-shipping-country-select');
          if (selector && !selector.hasAttribute('data-tiendasync-observed')) {
            selector.setAttribute('data-tiendasync-observed', 'true');
            setupCountrySelector();
          }
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function getCachedConfig(storeId, productId) {
    if (CONFIG.NO_CACHE) {
      log('Cache disabled, fetching fresh data');
      return null;
    }
    try {
      var key = CONFIG.CACHE_KEY + '_' + storeId + '_' + (productId || 'global');
      var cached = localStorage.getItem(key);
      if (!cached) return null;
      var data = JSON.parse(cached);
      if (Date.now() > data.expires) {
        localStorage.removeItem(key);
        return null;
      }
      return data.config;
    } catch (e) {
      return null;
    }
  }

  function setCachedConfig(storeId, productId, config) {
    if (CONFIG.NO_CACHE) return;
    try {
      var key = CONFIG.CACHE_KEY + '_' + storeId + '_' + (productId || 'global');
      localStorage.setItem(key, JSON.stringify({
        config: config,
        expires: Date.now() + CONFIG.CACHE_TTL
      }));
    } catch (e) {
      log('Cache write failed:', e);
    }
  }

  window.TiendaSyncClearCache = function() {
    try {
      Object.keys(localStorage).filter(function(k) {
        return k.startsWith('tiendasync');
      }).forEach(function(k) {
        localStorage.removeItem(k);
      });
      console.log('[TiendaSync] Caché limpiado. Recarga la página para ver cambios.');
      return true;
    } catch (e) {
      console.error('[TiendaSync] Error limpiando caché:', e);
      return false;
    }
  };

  function fetchConfig(storeId, productId, callback) {
    var cached = getCachedConfig(storeId, productId);
    if (cached) {
      log('Using cached config');
      callback(null, cached);
      return;
    }

    var url = CONFIG.API_URL + '?store_id=' + encodeURIComponent(storeId);
    if (productId) {
      url += '&product_id=' + encodeURIComponent(productId);
    }

    log('Fetching config from:', url);

    fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function(config) {
      log('Config received:', config);
      if (config && config.texts && config.texts.message_template) {
        lastReceivedTemplate = config.texts.message_template;
        if (CONFIG.DEBUG) {
          console.log('[TiendaSync] Template recibido del servidor:', lastReceivedTemplate);
        }
      }
      if (config.enabled) {
        setCachedConfig(storeId, productId, config);
      }
      callback(null, config);
    })
    .catch(function(err) {
      error('Fetch failed:', err);
      callback(err, null);
    });
  }

  function isWorkingDay(date, workingDays) {
    var day = date.getDay();
    return workingDays.indexOf(day) !== -1;
  }

  function addWorkingDays(startDate, days, workingDays) {
    if (days <= 0) return new Date(startDate);
    var result = new Date(startDate);
    var added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (isWorkingDay(result, workingDays)) {
        added++;
      }
    }
    return result;
  }

  function getCutoffInfo(cutoffTime) {
    var now = new Date();
    var parts = cutoffTime.split(':');
    var cutoffHour = parseInt(parts[0], 10);
    var cutoffMinute = parseInt(parts[1], 10) || 0;
    var cutoffSecond = parseInt(parts[2], 10) || 0;
    var cutoffDate = new Date(now);
    cutoffDate.setHours(cutoffHour, cutoffMinute, cutoffSecond, 0);
    var isPast = now >= cutoffDate;
    var diffMs = cutoffDate - now;
    var totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return {
      isPast: isPast,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      secondsRemaining: seconds,
      totalSeconds: totalSeconds,
      formatted: String(hours).padStart(2, '0') + 'h ' + String(minutes).padStart(2, '0') + 'm ' + String(seconds).padStart(2, '0') + 's'
    };
  }

  function formatDateShort(date, todayLabel, tomorrowLabel) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    if (compareDate.getTime() === today.getTime()) return todayLabel || 'hoy';
    if (compareDate.getTime() === tomorrow.getTime()) return tomorrowLabel || 'mañana';
    var days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
      return days[date.getDay()] + ' ' + date.getDate();
    }
    var months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return days[date.getDay()] + ' ' + date.getDate() + ' de ' + months[date.getMonth()];
  }

  function formatTime(hours, minutes) {
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }

  function formatWorkingDays(days, daysShort) {
    if (!days || days.length === 0) return '';
    var sorted = days.slice().sort(function(a, b) { return a - b; });
    var isConsecutive = true;
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i-1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive && sorted.length > 2) {
      return daysShort[sorted[0]] + '-' + daysShort[sorted[sorted.length - 1]];
    }
    return sorted.map(function(d) { return daysShort[d]; }).join(', ');
  }

  function calculateDeliveryDates(config) {
    var delivery = config.delivery;
    var product = config.product;
    var prepMinDays = (product && product.preparation_min_days != null) ? product.preparation_min_days : delivery.preparation_min_days;
    var prepMaxDays = (product && product.preparation_max_days != null) ? product.preparation_max_days : delivery.preparation_max_days;
    var shipMinDays = (product && product.shipping_min_days != null) ? product.shipping_min_days : delivery.shipping_min_days;
    var shipMaxDays = (product && product.shipping_max_days != null) ? product.shipping_max_days : delivery.shipping_max_days;
    var workingDays = (product && product.working_days) ? product.working_days : delivery.working_days;
    var cutoffTime = delivery.cutoff_time || '14:00:00';
    var prepCalcMode = delivery.preparation_calc_mode || 'min-max';
    var shipCalcMode = delivery.shipping_calc_mode || 'min-max';
    if (prepCalcMode === 'none') { prepMinDays = 0; prepMaxDays = 0; }
    else if (prepCalcMode === 'min-only') { prepMaxDays = prepMinDays; }
    if (shipCalcMode === 'none') { shipMinDays = 0; shipMaxDays = 0; }
    else if (shipCalcMode === 'min-only') { shipMaxDays = shipMinDays; }
    var cutoffInfo = getCutoffInfo(cutoffTime);
    var cutoffParts = cutoffTime.split(':');
    var cutoffHour = parseInt(cutoffParts[0], 10);
    var cutoffMinute = parseInt(cutoffParts[1], 10) || 0;
    var startDate = new Date();
    if (cutoffInfo.isPast) startDate.setDate(startDate.getDate() + 1);
    while (!isWorkingDay(startDate, workingDays)) startDate.setDate(startDate.getDate() + 1);
    var totalMinDays = prepMinDays + shipMinDays;
    var totalMaxDays = prepMaxDays + shipMaxDays;
    var minDate = addWorkingDays(startDate, totalMinDays, workingDays);
    var maxDate = addWorkingDays(startDate, totalMaxDays, workingDays);
    var prepMinDate = addWorkingDays(startDate, prepMinDays, workingDays);
    var prepMaxDate = addWorkingDays(startDate, prepMaxDays, workingDays);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var minDateCompare = new Date(minDate);
    minDateCompare.setHours(0, 0, 0, 0);
    var hoyOMañana = 'pronto';
    if (minDateCompare.getTime() === today.getTime()) {
      hoyOMañana = 'hoy';
    } else {
      var tmrw = new Date(today);
      tmrw.setDate(tmrw.getDate() + 1);
      if (minDateCompare.getTime() === tmrw.getTime()) hoyOMañana = 'mañana';
    }
    var daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    var workingDaysText = formatWorkingDays(workingDays, daysShort);
    return {
      minDate: minDate,
      maxDate: maxDate,
      prepMinDate: prepMinDate,
      prepMaxDate: prepMaxDate,
      minFormatted: formatDateShort(minDate, config.texts.today_label, config.texts.tomorrow_label),
      maxFormatted: formatDateShort(maxDate, config.texts.today_label, config.texts.tomorrow_label),
      prepMinFormatted: formatDateShort(prepMinDate, config.texts.today_label, config.texts.tomorrow_label),
      prepMaxFormatted: formatDateShort(prepMaxDate, config.texts.today_label, config.texts.tomorrow_label),
      cutoffInfo: cutoffInfo,
      cutoffTime: formatTime(cutoffHour, cutoffMinute),
      isPastCutoff: cutoffInfo.isPast,
      hoyOMañana: hoyOMañana,
      prepMinDays: prepMinDays,
      prepMaxDays: prepMaxDays,
      shipMinDays: shipMinDays,
      shipMaxDays: shipMaxDays,
      workingDays: workingDays,
      workingDaysText: workingDaysText
    };
  }

  function replaceVariables(template, dates) {
    var normalizedTemplate = String(template || '')
      .replace(/&#123;/g, '{')
      .replace(/&#125;/g, '}')
      .replace(/&lcub;/g, '{')
      .replace(/&rcub;/g, '}')
      .replace(/\\{\\{/g, '{')
      .replace(/\\}\\}/g, '}')
      .replace(/\\{\\s+/g, '{')
      .replace(/\\s+\\}/g, '}');

    var knownVariables = [
      'fecha_entrega_minima', 'fecha_entrega_maxima',
      'fecha_preparacion_minima', 'fecha_preparacion_maxima',
      'hora_corte', 'horas_restantes', 'minutos_restantes', 'segundos_restantes',
      'hoy_o_manana', 'dias_preparacion_min', 'dias_preparacion_max',
      'dias_envio_min', 'dias_envio_max', 'dias_laborales',
      'nombre_pais', 'nombre_pais_avanzado', 'nombre_region',
      'bandera_pais', 'bandera_pais_avanzado'
    ];
    
    knownVariables.forEach(function(varName) {
      var bracketPattern = new RegExp('\\\\[' + varName + '\\\\]', 'gi');
      normalizedTemplate = normalizedTemplate.replace(bracketPattern, '{' + varName + '}');
    });

    var countryName = geoLocation.countryName || 'tu país';
    var countryCode = geoLocation.countryCode;
    var countryFlag = getCountryFlag(countryCode);
    var regionName = geoLocation.regionName || geoLocation.city || '';

    if (CONFIG.DEBUG) {
      console.log('[TiendaSync] Geolocalización aplicada:', {
        countryName: countryName,
        countryCode: countryCode,
        countryFlag: countryFlag,
        regionName: regionName,
        source: geoLocation.source
      });
    }

    var replacements = {
      '{fecha_entrega_minima}': '<strong>' + dates.minFormatted + '</strong>',
      '{fecha_entrega_maxima}': '<strong>' + dates.maxFormatted + '</strong>',
      '{fecha_preparacion_minima}': '<strong>' + dates.prepMinFormatted + '</strong>',
      '{fecha_preparacion_maxima}': '<strong>' + dates.prepMaxFormatted + '</strong>',
      '{hora_corte}': dates.cutoffTime,
      '{horas_restantes}': String(dates.cutoffInfo.hoursRemaining),
      '{minutos_restantes}': String(dates.cutoffInfo.minutesRemaining),
      '{segundos_restantes}': String(dates.cutoffInfo.secondsRemaining) + 's',
      '{hoy_o_manana}': dates.hoyOMañana,
      '{dias_preparacion_min}': String(dates.prepMinDays),
      '{dias_preparacion_max}': String(dates.prepMaxDays),
      '{dias_envio_min}': String(dates.shipMinDays),
      '{dias_envio_max}': String(dates.shipMaxDays),
      '{dias_laborales}': dates.workingDaysText,
      '{nombre_pais}': countryName,
      '{nombre_pais_avanzado}': '<span class="tiendasync-country-name tiendasync-geo-dynamic">' + countryName + '</span>',
      '{nombre_region}': regionName,
      '{bandera_pais}': countryFlag,
      '{bandera_pais_avanzado}': '<span class="tiendasync-country-flag tiendasync-geo-dynamic">' + countryFlag + '</span>'
    };

    var result = normalizedTemplate;
    Object.keys(replacements).forEach(function(key) {
      while (result.indexOf(key) !== -1) {
        result = result.replace(key, replacements[key]);
      }
      var lowerKey = key.toLowerCase();
      while (result.indexOf(lowerKey) !== -1) {
        result = result.replace(lowerKey, replacements[key]);
      }
    });

    if (CONFIG.DEBUG) {
      var unreplacedTokens = result.match(/\\{[a-zA-Z0-9_]+\\}/g);
      if (unreplacedTokens && unreplacedTokens.length > 0) {
        console.warn('[TiendaSync] Variables sin reemplazar:', unreplacedTokens);
      }
    }
    lastRenderedMessage = result;
    return result;
  }

  function createWidgetStyles(config) {
    var app = config.appearance;
    return '.tiendasync-widget { margin: ' + app.margin_top + 'px ' + app.margin_right + 'px ' + app.margin_bottom + 'px ' + app.margin_left + 'px; font-family: inherit; box-sizing: border-box; } .tiendasync-message { padding: 12px 16px; background-color: ' + app.message_background_color + '; color: ' + app.message_text_color + '; border: ' + app.message_border_width + 'px ' + app.message_border_style + ' ' + app.message_border_color + '; border-radius: ' + app.message_border_radius + 'px; font-size: 14px; line-height: 1.5; display: flex; align-items: center; gap: 10px; } .tiendasync-message svg { flex-shrink: 0; width: 20px; height: 20px; } .tiendasync-countdown { font-variant-numeric: tabular-nums; font-weight: 600; } .tiendasync-progress { margin-top: 16px; padding: 16px; background: #fff; border: 1px solid ' + app.progress_line_color + '; border-radius: 8px; } .tiendasync-progress-bar { display: flex; align-items: center; justify-content: space-between; position: relative; } .tiendasync-progress-bar::before { content: ""; position: absolute; top: 50%; left: 32px; right: 32px; height: 2px; background: ' + app.progress_line_color + '; transform: translateY(-50%); z-index: 0; } .tiendasync-progress-step { display: flex; flex-direction: column; align-items: center; z-index: 1; background: #fff; padding: 0 8px; } .tiendasync-progress-icon { width: 40px; height: 40px; border-radius: 50%; background: ' + app.progress_icon_bg_color + '; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; } .tiendasync-progress-icon svg { width: 20px; height: 20px; color: ' + app.progress_icon_color + '; } .tiendasync-progress-icon.active { background: ' + app.progress_icon_color + '; } .tiendasync-progress-icon.active svg { color: #fff; } .tiendasync-progress-title { font-size: 12px; font-weight: 500; color: ' + app.progress_title_color + '; margin-bottom: 2px; } .tiendasync-progress-date { font-size: 11px; color: ' + app.progress_date_color + '; } .tiendasync-geo-dynamic { transition: opacity 0.2s ease; } .tiendasync-geo-updating { opacity: 0.6; }';
  }

  function createIconSvg(iconType) {
    var icons = {
      'shopping-bag': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      'package': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
      'map-pin': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
    };
    return icons[iconType] || icons['package'];
  }

  function createProgressBarHTML(config, dates) {
    var steps = [
      { icon: 'shopping-bag', title: 'Pedido', date: 'Hoy', active: true },
      { icon: 'package', title: 'Preparado', date: dates.prepMinFormatted, active: false },
      { icon: 'map-pin', title: 'Entregado', date: dates.minFormatted, active: false }
    ];
    var html = '<div class="tiendasync-progress"><div class="tiendasync-progress-bar">';
    steps.forEach(function(step) {
      html += '<div class="tiendasync-progress-step">';
      html += '<div class="tiendasync-progress-icon' + (step.active ? ' active' : '') + '">';
      html += createIconSvg(step.icon);
      html += '</div>';
      html += '<span class="tiendasync-progress-title">' + step.title + '</span>';
      html += '<span class="tiendasync-progress-date">' + step.date + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function createWidgetHTML(config, dates) {
    var messageHTML = replaceVariables(config.texts.message_template, dates);
    var widgetMode = config.appearance.widget_mode || 'message-bar';
    var html = '<div id="' + CONFIG.WIDGET_ID + '" class="tiendasync-widget">';
    if (widgetMode === 'message-only') {
      html += '<div class="tiendasync-message"><span>' + messageHTML + '</span></div>';
    } else if (widgetMode === 'bar-only') {
      html += createProgressBarHTML(config, dates);
    } else if (widgetMode === 'bar-message') {
      html += createProgressBarHTML(config, dates);
      html += '<div class="tiendasync-message"><span>' + messageHTML + '</span></div>';
    } else {
      html += '<div class="tiendasync-message"><span>' + messageHTML + '</span></div>';
      html += createProgressBarHTML(config, dates);
    }
    html += '</div>';
    return html;
  }

  function injectStyles(config) {
    var styleId = 'tiendasync-styles';
    var existing = document.getElementById(styleId);
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = createWidgetStyles(config);
    document.head.appendChild(style);
  }

  function findWidgetContainer() {
    var manualContainer = document.getElementById('tiendasync-container') || document.getElementById('delivery-widget');
    if (manualContainer) {
      log('Using manual container');
      return { element: manualContainer, position: 'inside' };
    }
    var selectors = ['.js-addtocart', '.js-add-to-cart', 'button[data-add-to-cart]', '.product-form__submit', '#addToCart', '.add-to-cart-button', 'form[action*="/cart/add"] button[type="submit"]', '.product-buy-button', 'button.btn-primary[type="submit"]', '.js-product-form button[type="submit"]'];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        log('Found container with selector:', selectors[i]);
        return { element: el, position: 'after' };
      }
    }
    log('No container found');
    return null;
  }

  function startCountdown(config) {
    if (countdownInterval) clearInterval(countdownInterval);
    if (config.texts.message_template.indexOf('segundos_restantes') === -1) return;
    countdownInterval = setInterval(function() {
      var dates = calculateDeliveryDates(config);
      var messageElement = document.querySelector('#' + CONFIG.WIDGET_ID + ' .tiendasync-message span');
      if (messageElement) messageElement.innerHTML = replaceVariables(config.texts.message_template, dates);
    }, 1000);
  }

  function renderWidget(config) {
    var existing = document.getElementById(CONFIG.WIDGET_ID);
    if (existing) existing.remove();
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    if (!config.enabled) { log('Widget disabled'); return; }
    var container = findWidgetContainer();
    if (!container) { error('Could not find container for widget'); return; }
    var dates = calculateDeliveryDates(config);
    log('Calculated dates:', dates);
    if (CONFIG.DEBUG) {
      console.log('[TiendaSync] Diagnóstico completo:');
      console.log('  Versión del script:', SCRIPT_VERSION);
      console.log('  Template original:', lastReceivedTemplate);
      console.log('  Mensaje renderizado:', lastRenderedMessage);
      console.log('  Fechas calculadas:', { minFormatted: dates.minFormatted, maxFormatted: dates.maxFormatted, prepMinFormatted: dates.prepMinFormatted, prepMaxFormatted: dates.prepMaxFormatted, workingDaysText: dates.workingDaysText });
      console.log('  Geolocalización:', geoLocation);
    }
    injectStyles(config);
    var widgetHTML = createWidgetHTML(config, dates);
    var widgetElement = document.createElement('div');
    widgetElement.innerHTML = widgetHTML;
    var widget = widgetElement.firstChild;
    var position = config.appearance.widget_position || 'below';
    if (container.position === 'inside') {
      container.element.appendChild(widget);
    } else if (container.position === 'after') {
      container.element.parentNode.insertBefore(widget, container.element.nextSibling);
    } else if (position === 'above') {
      container.element.parentNode.insertBefore(widget, container.element);
    } else {
      container.element.parentNode.insertBefore(widget, container.element.nextSibling);
    }
    currentConfig = config;
    startCountdown(config);
    log('Widget rendered successfully');
  }

  function init() {
    log('Initializing TiendaSync widget v' + SCRIPT_VERSION + '...');
    var lsData = getLSData();
    if (!lsData || !lsData.storeId) { log('Not on a product page or LS not available'); return; }
    log('Store ID:', lsData.storeId, 'Product ID:', lsData.productId);
    
    setupCountrySelector();
    setupMutationObserver();
    
    // First fetch geolocation, THEN fetch config and render
    fetchGeolocation(function(geoErr, geo) {
      if (geoErr) {
        log('Geolocation error (using fallback):', geoErr);
      } else {
        log('Geolocation obtained:', geo);
      }
      
      // Now fetch config after geolocation is ready
      fetchConfig(lsData.storeId, lsData.productId, function(configErr, config) {
        if (configErr) { error('Failed to fetch config:', configErr); return; }
        if (!config || !config.enabled) { log('Widget not enabled for this store'); return; }
        
        // Ensure geolocation has valid values
        if (geoLocation.source === 'pending' || !geoLocation.countryName) {
          applyFallbackGeo();
        }
        
        log('Rendering widget with geolocation:', geoLocation);
        renderWidget(config);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  window.TiendaSync = {
    version: SCRIPT_VERSION,
    init: init,
    setDebug: function(enabled) { CONFIG.DEBUG = enabled; },
    clearCache: function() {
      var keys = Object.keys(localStorage);
      keys.forEach(function(key) {
        if (key.indexOf(CONFIG.CACHE_KEY) === 0 || key.indexOf(CONFIG.GEO_CACHE_KEY) === 0) localStorage.removeItem(key);
      });
      log('Cache cleared');
    },
    refresh: function() { if (currentConfig) renderWidget(currentConfig); },
    getConfig: function() { return currentConfig; },
    getGeoLocation: function() { return geoLocation; },
    setGeoLocation: function(geo) {
      geoLocation = {
        countryName: geo.countryName || geoLocation.countryName,
        countryCode: geo.countryCode || geoLocation.countryCode,
        regionName: geo.regionName || geoLocation.regionName,
        city: geo.city || geoLocation.city,
        source: 'manual'
      };
      if (currentConfig) renderWidget(currentConfig);
      return geoLocation;
    },
    getDiagnostics: function() {
      return {
        version: SCRIPT_VERSION,
        lastReceivedTemplate: lastReceivedTemplate,
        lastRenderedMessage: lastRenderedMessage,
        currentConfig: currentConfig,
        geoLocation: geoLocation,
        debug: CONFIG.DEBUG,
        noCache: CONFIG.NO_CACHE
      };
    }
  };
})();`;

Deno.serve(async (req: Request) => {
  console.log("[widget-script] Request received:", req.method, new URL(req.url).pathname);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Version endpoint
  if (url.pathname.endsWith("/version")) {
    return new Response(
      JSON.stringify({
        version: "2.3.1",
        updated: "2026-01-20",
        features: [
          "Geolocation via IP (ipapi.co)",
          "Country selector listener (.js-shipping-country-select)",
          "Dynamic flag emoji generation",
          "Fallback to store country",
          "Variables: {nombre_pais}, {bandera_pais}, {nombre_region}, {nombre_pais_avanzado}, {bandera_pais_avanzado}"
        ]
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Serve the widget script
  console.log("[widget-script] Serving widget script v2.3.1");
  
  return new Response(WIDGET_SCRIPT, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
