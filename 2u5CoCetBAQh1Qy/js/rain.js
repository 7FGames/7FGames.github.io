_rain_timer = null;

function start_raining() {
   stop_raining();

   let increment = 0;
   let dropSpace = 20;
   let drops = "";
   let backDrops = "";

   while (increment < 100) {
      let randoHundo = (Math.floor(Math.random() * 98));
      let randoFiver = (Math.floor(Math.random() * dropSpace));
      increment += randoFiver;

      let speed = `calc(var(--drop-speed) + 0.0${randoHundo}s)`;

      drops += '<div class="drop" style="'
            + 'left: ' + increment + '%; '
            + 'animation-delay: 0.' + randoHundo + 's; '
            + 'animation-duration: ' + speed + ';">'
         + '<div class="stem" style="'
            + 'animation-delay: 0.' + randoHundo + 's; '
            + 'animation-duration: ' + speed + ';">'
         + '</div>'
         + '</div>';

      backDrops += '<div class="drop" style="'
            + 'right: ' + increment + '%; '
            + 'animation-delay: 0.' + randoHundo + 's; '
            + 'animation-duration: ' + speed + ';">'
         + '<div class="stem" style="'
            + 'animation-delay: 0.' + randoHundo + 's; '
            + 'animation-duration: ' + speed + ';">'
         + '</div>'
         + '</div>';
   }

   $('.rain.front-row').append(drops);
   $('.rain.back-row').append(backDrops);

   _rain_timer = setTimeout(() => {
      start_raining();
   }, 10000);
}

function stop_raining() {
   $('.rain').empty();
   if (_rain_timer != null) {
      clearTimeout(_rain_timer);
      _rain_timer = null;
   }
}
