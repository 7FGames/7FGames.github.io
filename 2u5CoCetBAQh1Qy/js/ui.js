class DOMManager {
   constructor() {
      this.content = $("#content");
      this.hidden = $("#hiddenContent");
      this.ui_shown = false;
      this.ambient = null;

      // click-to-start anims
      $("#pressStart")
      .mouseover(() => {
         $("#pressStart .hover-img")
         .removeClass("animate__fadeOut")
         .addClass("animate__fadeIn")
         .show();
      })
      .mouseout(() => {
         $("#pressStart .hover-img")
         .removeClass("animate__fadeIn")
         .addClass("animate__fadeOut")
         .hide();
      });

      // setup DOM callbacks and handlers
      $("#playerIn").on("keyup", function (ev) {
         if (ev.key != 'Enter')
            return;

         zmac.handle_raw($(this).val());
         $(this).val("");
      });
   }

   init() {
      $('#pressStart').hide();
   }

   setup_audio() {
      // Note: this must be called from user click handler
      this.audio_ctx = new AudioContext();
      this.audio_ctx.resume();
   }

   mute(state) {
      Howler.mute(state);
   }

   async delay(time) {
      await timeout(time * 1000);
   }

   async show_message(msg, args) {
      let outer = $(
         "<div>" +
         "  <div class='message'>" +
         "    <div class='animate__animated animate__fadeIn'>" + msg + "</div>" +
         "  </div>" +
         "</div>");

      if (args.fullscreen)
         outer.addClass("go-fullscreen");

      this.content.append(outer);
      await this.delay(args.time);
      let inner = outer.find(".message div");

      return new Promise(function (resolve, reject) {
         inner.addClass("animate__fadeOut")
            .on("animationend", function () {
               outer.remove();
               resolve();
            });
      });
   }

   async show_image(path, args) {
      let outer = $(
         "<div>" +
         "  <div class='image'>" +
         "    <img class='animate__animated animate__fadeIn' " +
         "         src='" + path + "' />" +
         "  </div>" +
         "</div>");

      if (args.fullscreen)
         outer.addClass("go-fullscreen");

      this.content.append(outer);
      await this.delay(args.time);
      let inner = outer.find(".image img");

      return new Promise(function (resolve, reject) {
         inner.addClass("animate__fadeOut")
            .on("animationend", function () {
               outer.remove();
               resolve();
            });
      });
   }

   set_background(path) {
      path = "data/assets/" + path;
      let elem = $(
         "<div class='animate__animated animate__fadeIn background'>"+
         "  <img src='"+ path +"'>" +
         "</div>");
      this.content.append(elem);
   }

   set_ambient(path, random) {
      path = "data/assets/" + path;

      // stop previous ambient
      if (this.ambient)
         this.ambient.stop();

      // start new one
      this.ambient = new Howl({
         src: [path + ".ogg", path + ".mp3"],
         loop: true,
         onload: () => {
            if (random !== false)
               this.ambient.seek(Math.floor(Math.random() * this.ambient.duration()));
         }
      });

      // try to use te current (unlocked) audio context
      this.ambient.ctx = this.audio_ctx;
      this.ambient.play();
      this.ambient.fade(0, 1, 4000);
   }

   set_effects(effects) {
      if (!Array.isArray(effects)) {
         console.error("set_effects called without an Array!");
         return;
      }

      effects.includes("rain") ? start_raining() : stop_raining();
   }

   toggle_ui() {
      let ui = $("#userIface");
      if (this.ui_shown) {
         ui.addClass("animate__animated animate__fadeOut");
         ui.hide();
      }
      else {
         ui.addClass("animate__animated animate__fadeIn");
         ui.show();
         $("#playerIn").val("").focus();
      }
      this.ui_shown = !this.ui_shown;
   }

   tell(msg, type) {
      let content = msg;
      if (type == "user")
         content = "&gt; " + content;
      else if (type == "system")
         content = "<i>" + content + "</i>";
      else if (type == "error")
         content = "<span class='error'>" + content + "</span>";
      let record = $("<div>"+ content +"</div>");
      if (type)
         record.addClass("type-" + type);

      let holder = $("#systemOut #outDst");
      if (!holder.length)
         holder = $("#systemOut");
      holder.append(record);
      holder.scrollTop(holder.prop("scrollHeight"));
   }

   open_box() {
      $("#systemOut").append("<div id='outDst' class='box'>");
   }

   close_box() {
      $("#systemOut #outDst").removeAttr("id");
   }

   the_end() {
      $(".input-holder").hide();
   }
};

view = new DOMManager();
tell = view.tell.bind(view);
the_end = view.the_end.bind(view);
