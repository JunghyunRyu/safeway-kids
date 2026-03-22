/**
 * Kakao Map HTML content as inline string.
 * Using inline HTML instead of require("*.html") so that WebView loads with
 * about:blank origin, which allows external script loading (Kakao Maps SDK).
 * file:// origin from require() blocks cross-origin script requests.
 */
export const MAP_HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SAFEWAY KIDS Map</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .eta-overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      z-index: 100;
      display: none;
    }
    .status-dot {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background: #ccc;
      z-index: 100;
    }
    .status-dot.connected { background: #4CAF50; }
    .status-dot.disconnected { background: #f44336; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="eta" class="eta-overlay"></div>
  <div id="status" class="status-dot disconnected"></div>

  <script>
    let map = null;
    let busMarkers = {};
    let stopMarkers = [];
    let polyline = null;
    let kakaoLoaded = false;

    function handleMessage(data) {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      switch (msg.type) {
        case 'init':
          initMap(msg.apiKey, msg.center);
          break;
        case 'updateBus':
          updateBusMarker(msg.vehicleId, msg.lat, msg.lng, msg.heading);
          break;
        case 'setStops':
          setStopMarkers(msg.stops);
          break;
        case 'setEta':
          setEta(msg.text);
          break;
        case 'setStatus':
          setConnectionStatus(msg.connected);
          break;
        case 'setCenter':
          if (map) {
            map.setCenter(new kakao.maps.LatLng(msg.lat, msg.lng));
          }
          break;
        case 'setDriverPosition':
          updateDriverMarker(msg.lat, msg.lng);
          break;
        case 'addPickupMarker':
          addPickupMarker(msg.lat, msg.lng, msg.label);
          break;
      }
    }

    window.addEventListener('message', function(e) {
      handleMessage(e.data);
    });
    document.addEventListener('message', function(e) {
      handleMessage(e.data);
    });

    function initMap(apiKey, center) {
      if (kakaoLoaded) {
        createMap(center);
        return;
      }

      var script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + apiKey + '&autoload=false';
      script.onload = function() {
        kakao.maps.load(function() {
          kakaoLoaded = true;
          createMap(center);
        });
      };
      script.onerror = function(e) {
        var errMsg = 'SDK 로드 실패 (appkey: ' + apiKey.slice(0,8) + '..., origin: ' + location.href + ')';
        document.getElementById('map').innerHTML =
          '<div style="padding:16px;color:#c00;font-size:13px;word-break:break-all;">' + errMsg + '</div>';
      };
      document.head.appendChild(script);
    }

    function createMap(center) {
      var container = document.getElementById('map');
      var options = {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      };
      map = new kakao.maps.Map(container, options);
      sendToRN({ type: 'mapReady' });
    }

    function updateBusMarker(vehicleId, lat, lng, heading) {
      if (!map) return;
      var position = new kakao.maps.LatLng(lat, lng);
      if (busMarkers[vehicleId]) {
        busMarkers[vehicleId].setPosition(position);
      } else {
        var markerImage = new kakao.maps.MarkerImage(
          'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
            '<circle cx="16" cy="16" r="14" fill="#2196F3" stroke="white" stroke-width="3"/>' +
            '<text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold">B</text>' +
            '</svg>'
          ),
          new kakao.maps.Size(32, 32),
          { offset: new kakao.maps.Point(16, 16) }
        );
        var marker = new kakao.maps.Marker({
          position: position,
          map: map,
          image: markerImage,
        });
        busMarkers[vehicleId] = marker;
      }
      map.panTo(position);
    }

    var pickupMarkers = [];

    function addPickupMarker(lat, lng, label) {
      if (!map) return;
      var position = new kakao.maps.LatLng(lat, lng);
      var markerImage = new kakao.maps.MarkerImage(
        'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
          '<circle cx="14" cy="14" r="12" fill="#1976D2" stroke="white" stroke-width="2"/>' +
          '<text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>' +
          '</svg>'
        ),
        new kakao.maps.Size(28, 28),
        { offset: new kakao.maps.Point(14, 14) }
      );
      var marker = new kakao.maps.Marker({
        position: position,
        map: map,
        image: markerImage,
      });
      var infoWindow = new kakao.maps.InfoWindow({
        content: '<div style="padding:4px 8px;font-size:12px;">' + label + '</div>',
      });
      kakao.maps.event.addListener(marker, 'click', function() {
        infoWindow.open(map, marker);
      });
      pickupMarkers.push(marker);
    }

    var driverMarker = null;

    function updateDriverMarker(lat, lng) {
      if (!map) return;
      var position = new kakao.maps.LatLng(lat, lng);
      if (driverMarker) {
        driverMarker.setPosition(position);
      } else {
        var markerImage = new kakao.maps.MarkerImage(
          'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="2"/>' +
            '<circle cx="12" cy="12" r="4" fill="white"/>' +
            '</svg>'
          ),
          new kakao.maps.Size(24, 24),
          { offset: new kakao.maps.Point(12, 12) }
        );
        driverMarker = new kakao.maps.Marker({
          position: position,
          map: map,
          image: markerImage,
        });
      }
      map.panTo(position);
    }

    function setStopMarkers(stops) {
      if (!map) return;
      stopMarkers.forEach(function(m) { m.setMap(null); });
      stopMarkers = [];
      if (polyline) { polyline.setMap(null); }
      var path = [];
      stops.forEach(function(stop, index) {
        var position = new kakao.maps.LatLng(stop.lat, stop.lng);
        path.push(position);
        var markerImage = new kakao.maps.MarkerImage(
          'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
            '<circle cx="14" cy="14" r="12" fill="' + (stop.done ? '#4CAF50' : '#FF9800') + '" stroke="white" stroke-width="2"/>' +
            '<text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">' + (index + 1) + '</text>' +
            '</svg>'
          ),
          new kakao.maps.Size(28, 28),
          { offset: new kakao.maps.Point(14, 14) }
        );
        var marker = new kakao.maps.Marker({
          position: position,
          map: map,
          image: markerImage,
        });
        var infoWindow = new kakao.maps.InfoWindow({
          content: '<div style="padding:4px 8px;font-size:12px;">' + stop.name + '</div>',
        });
        kakao.maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
        });
        stopMarkers.push(marker);
      });
      if (path.length > 1) {
        polyline = new kakao.maps.Polyline({
          map: map,
          path: path,
          strokeWeight: 3,
          strokeColor: '#2196F3',
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
        });
      }
      if (path.length > 0) {
        var bounds = new kakao.maps.LatLngBounds();
        path.forEach(function(p) { bounds.extend(p); });
        map.setBounds(bounds);
      }
    }

    function setEta(text) {
      var el = document.getElementById('eta');
      if (text) {
        el.textContent = text;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    }

    function setConnectionStatus(connected) {
      var el = document.getElementById('status');
      el.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
    }

    function sendToRN(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }
  </script>
</body>
</html>`;
