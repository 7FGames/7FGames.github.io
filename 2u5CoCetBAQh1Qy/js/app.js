
DEBUG = false;

async function start_app() {
   _("Loading app...");
   view.init();
   view.setup_audio();

   // show fullscreen message and credits
   if (! Cookies.get('skip-intro')) {
      let msg = (
         "Es mejor jugar a <b>Zorkraft</b> en pantalla completa.<br>" +
         "Pulsa F11 o configura tu navegador correctamente."
      );
      let args = {fullscreen: true, time: 3};
      await view.delay(0.5);
      await view.show_message(msg, args);
      await view.show_image("images/7f-games.png", args);
      Cookies.set('skip-intro', 'true');
   }

   // show main input and output widgets
   view.toggle_ui();

   // now, load app and run start function
   _("Loading scene...");
   tell("¡Bienvenido a Zorkraft!<cr>");
   $.getScript("data/episode1.js");
}

window.addEventListener("load", function() {
   // NOTE: this is critical for audio; user must start inteaction
   $('#pressStart').show().click(start_app);

   // NOTE: just for devel
   // $('#pressStart').click();
});
