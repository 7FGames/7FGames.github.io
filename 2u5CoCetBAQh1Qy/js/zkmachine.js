class GameObject {
   constructor(id, name, flags) {
      this.id = id;
      if (flags === undefined)
         flags = {};
      this.flags = flags;
      this.is = {};

      let fds = name.split(" ");
      this.name = fds.shift();
      this.adjective = fds.join(" ");

      let article = this._get_article();
      this.idesc = `${article} ${name}`;
   }

   describe(holder) {
      if (!Array.isArray(this.idesc))
         tell(this.idesc);
      else {
         for (let msg of this.idesc)
            tell(msg);
      }
   }

   syntax_match(input) {
      var retval = {
         match: false,
         remain: "",
         object: this,
      };
      var exp = new RegExp("^" + this.name + "(?!\S)", 'i');
      if (exp.test(input)) {
         let m = exp.exec(input);
         retval.remain = input.substring(m[0].length);
         retval.match = true;
      }
      return retval;
   }

   handle(prsa, prso, prsi) {
      return false;
   }

   _get_article(det=false) {
      let ps = this.flags;
      if (!det) {
         let art = ps.male ? "un" : "una";
         return art + (ps.one ? "" : (ps.male ? "os" : "s"));
      }
      let art = ps.male ? "el" : "la";
      return ps.one ? art : (ps.male ? "los" : "las");
   }

   det_name(capitalize=false) {
      let art = this._get_article(true);
      if (capitalize)
         art = art[0].toUpperCase() + art.slice(1);
      return art + " " + this.name;
   }

   gen_and_num() {
      let ps = this.flags;
      return (ps.male ? "o" : "a") + (ps.one ? "" : "s");
   }
};

class Container extends GameObject {
   constructor(items, id, name, flags) {
      super(id, name, flags);
      this.flags.can_open = true;

      if (items === undefined)
         items = {};
      this.items = items;

      this.is.open = true;
      this.is.container = true;
      this.idesc = "Parece un contenedor de algún tipo.";
   }

   init() {};

   put(item) {
      if (this.items.hasOwnProperty(item.id)) {
         _("ERROR: this object is already on this container!");
         return;
      }
      this.items[item.id] = item;
   }

   get(name) {
      for (let n in this.items) {
         let item = this.items[n];
         if (item.name != name)
            continue;

         delete this.items[n];
         return item;
      };

      _("ERROR: object not found!");
   }

   find_match(input, rec=true) {
      let result = {match: false};
      for (let idx in this.items) {
         let item = this.items[idx];
         result = item.syntax_match(input);
         if (result.match) {
            result.holder = this;
            break;
         }
         if (item.is.container && item.is.open)
            result = item.find_match(input, false);
      }
      return result;
   }

   describe_items(holder) {
      for (const name in this.items) {
         let item = this.items[name];
         item.describe(holder);
      }
   }

   enumerate_items() {
      let result = "";
      let joint = ",";
      let c = Object.entries(this.items).length;
      for (const key in this.items) {
         if (--c == 0) joint = " y";
         result += `${joint} ${this.items[key].idesc}`;
      }
      return result.substr(2);
   }

   describe() {
      super.describe();
      if (this.is.open)
         this.describe_items(this);
      tell("<cr>");
      return true;
   }
}

class RoomFactory {
   static instances = {};

   static ref(RoomClass) {
      let name = RoomClass.name;
      if (!this.instances.hasOwnProperty(name)) {
         let r = new RoomClass();
         this.instances[name] = r;
         r.init();
      }
      return this.instances[name];
   }
};

class Room extends Container {
   constructor(items) {
      super(items, "room", "room");
      this.desc = "";
      this.exits = {};
      this.is = {room: true};
      this.idesc = "Estás en un sitio indescriptible.";
   }

   static ref() {
      return RoomFactory.ref(this);
   }

   on_enter() {
      if (this.background)
         view.set_background(this.background);
      if (this.ambient)
         view.set_ambient(this.ambient);

      view.set_effects(this.effects || []);
      this.describe();
   }

   describe() {
      if (!Array.isArray(this.desc))
         tell(this.desc);
      else {
         for (let msg of this.desc)
            tell(msg);
      }
      this.describe_items(this);
      tell("<cr>");
      return true;
   }
};

class Inventory extends Container{
   constructor() {
      super({}, "inventory", "inventario");
      this.is = {player: true};
   }

   is_empty() {
      return Object.keys(this.items).length == 0;
   }
};

class Player {
   constructor(room) {
      this.inventory = new Inventory();
      this.room = room;
   }

   move(room) {
      if (DEBUG)
         _("move to room:", room);

      this.room = room;
      this.room.on_enter();
   }
};

class UknownObject extends GameObject {
   constructor(name) {
      super("unknown", name);
   }

   handle(prsa, prso, prsi) {
      tell(`No sé a qué te refieres con '${this.name}'. <cr>`);
      return true;
   }
};

class Verb {
   constructor() {
      this.syntax = {defs: []};
   }

   syntax_match(input) {
      var retval = {
         match: false,
         remain: "",
         args: {}
      };

      for (const def of this.syntax.defs) {
         if (DEBUG)
            _(input, def, def.exp.test(input));

         if (!def.exp.test(input))
            continue;

         let m = def.exp.exec(input);
         retval.remain = input.substring(m[0].length);
         retval.match = true;
         retval.args = def.args;
         break;
      }

      return retval;
   }

   handle(prsa, prso, prsi) {
      tell("[Verbo no implementado...]<cr>", "system");
      return true;
   };
};

class VerbMuteSound extends Verb {
   constructor() {
      super();
      this.name = "mute";
      this.syntax.defs = [
         {exp: /^silencio(?!\S)/i, args: {state: true}},
         {exp: /^silenciar(?!\S)/i, args: {state: true}} ,
         {exp: /^no silenciar(?!\S)/i, args: {state: false}} ,
      ];
   }

   handle(prsa, prso, prsi) {
      if (prsa.args.state)
         tell("[Se han silenciado todos los sonidos] <cr>", "system");
      else
         tell("[Se han activado todos los sonidos] <cr>", "system");
      view.mute(prsa.args.state);
      return true;
   }
};

class VerbLook extends Verb {
   constructor(player) {
      super();
      this.name = "look";
      this.player = player;
      this.syntax.defs = [
         {exp: /^mirar?(?!\S)/i},
         {exp: /^ver(?!\S)/i},
         {exp: /^v(?!\S)/i},
         {exp: /^examinar?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (prso) {
         if (prso.obj.on_view !== undefined) {
            prso.obj.on_view();
            return true;
         }
         return prso.obj.describe(prso.holder, true);
      }
      if (prso == null && prsi == null)
         return this.player.room.describe();

      tell("No veo eso que dices. <cr>");
      return true;
   }
};

class VerbPick extends Verb {
   constructor(inventory) {
      super();
      this.name = "pick";
      this.inventory = inventory;
      this.syntax.defs = [
         {exp: /^coger?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (!prso) {
         tell("¿Qué quieres que coja? <cr>");
         return true;
      }

      if (!prso.obj.flags.take) {
         tell(`Me temo que ${prso.obj.det_name()} no se deja llevar. <cr>`);
         return true;
      }

      if (prso.holder == this.inventory) {
         tell(`Ya tienes ${prso.obj.det_name()}. <cr>`);
         return true;
      }

      prso.holder.get(prso.obj.name);
      this.inventory.put(prso.obj);
      tell(`Cogid${prso.obj.gen_and_num()}. <cr>`);
      return true;
   }
};

class VerbOpen extends Verb {
   constructor() {
      super();
      this.name = "open";
      this.syntax.defs = [
         {exp: /^abrir?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (!prso) {
         tell("¿Qué quieres que abra? <cr>");
         return true;
      }

      let item = prso.obj;
      if (item.is.open) {
         tell(item.det_name(true) + " ya está abiert" + item.gen_and_num() + ".");
         return true;
      }

      if (!item.flags.can_open) {
         tell("No sé como abrir eso que dices. <cr>");
         return true;
      }

      let was_open = item.is.open;
      item.is.open = true;
      if (!was_open && item.on_open !== undefined)
         item.on_open();
      return true;
   }
};

class VerbClose extends Verb {
   constructor() {
      super();
      this.name = "close";
      this.syntax.defs = [
         {exp: /^cerrar?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (!prso) {
         tell("¿Qué quieres que cierre? <cr>");
         return true;
      }

      let item = prso.obj;
      if (!item.is.open) {
         tell(`El ${item.name} ya está cerrado.`);
         return true;
      }

      if (!item.flags.can_open) {
         tell("Uff, no sé como cerrar eso. <cr>");
         return true;
      }

      let was_open = item.is.open;
      item.is.open = false;
      if (was_open && item.on_close !== undefined)
         item.on_close();
      return true;
   }
};

class VerbPlace extends Verb {
   constructor() {
      super();
      this.name = "place";
      this.syntax.defs = [
         {exp: /^colocar?(?!\S)/i},
         {exp: /^poner?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (!prso) {
         tell(`¿Qué quieres ${prsa.match}? <cr>`);
         return true;
      }

      if (!prsi) {
         let name = prso.obj.det_name();
         tell(`¿Dónde quieres ${prsa.match} ${name}?`);
         return true;
      }

      // Note: this verb shall be handled by prsi or prso
      tell(random_choice([
         "No sé cómo hacer eso.",
         "¿Estás seguro de que eso se puede hacer?",
      ]));
      return true;
   }
};

class VerbPull extends Verb {
   constructor() {
      super();
      this.name = "pull";
      this.syntax.defs = [
         {exp: /^tirar?(?!\S)/i},
      ];
   }
};

class VerbPush extends Verb {
   constructor() {
      super();
      this.name = "push";
      this.syntax.defs = [
         {exp: /^empujar?(?!\S)/i},
      ];
   }
};

class VerbActivate extends Verb {
   constructor() {
      super();
      this.name = "activate";
      this.syntax.defs = [
         {exp: /^activar?(?!\S)/i},
         {exp: /^accionar?(?!\S)/i},
      ];
   }

   handle(prsa, prso, prsi) {
      if (!prso) {
         tell(random_choice([
            "¿Qué quieres activar exáctamente?",
            "Necesitas ser más específico.",
         ]));
      }
      else {
         tell("No sé muy bien cómo hacer eso. <cr>");
      }
      return true;
   }
};

class VerbInventory extends Verb {
   constructor(inventory) {
      super();
      this.inventory = inventory;
      this.name = "inventory";
      this.syntax.defs = [
         {exp: /^inventario(?!\S)/i},
         {exp: /^inv(?!\S)/i} ,
         {exp: /^i(?!\S)/i} ,
      ];
   }

   handle(prsa, prso, prsi) {
      if (this.inventory.is_empty()) {
         tell("Ahora mismo no llevas nada encima. <cr>");
      }
      else {
         tell("Llevas:");
         view.open_box();
         this.inventory.describe_items(this.inventory);
         view.close_box();
         tell("<cr>");
      }
      return true;
   }
};

class VerbGoto extends Verb {
   constructor(name, abbrs, player) {
      super();
      this.name = name;
      this.player = player;

      this.syntax.defs = [];
      for (let a of abbrs)
         this.syntax.defs.push({exp: new RegExp(`^${a}(?!\\S)`, "i")});
   }

   handle(prsa, prso, prsi) {
      let next_room = this.player.room.exits[this.name];
      if (!next_room) {
         tell("No puedes ir en esa dirección.");
         return true;
      }

      let locked = this.player.room.locked_exits;
      if (locked && locked[this.name]) {
         tell("Algo te impide ir en esa dirección.");
         return true;
      }

      this.player.move(next_room);
      return true;
   }
};

class ZKMachine {
   constructor() {
      this.player = new Player();
      this.verbs = {};
   }

   handle_raw(input) {
      input = input.trim();
      tell(input, "user");
      if (!input) {
         tell(random_choice(["Mmmm...", "Ehm...", "¿Seguro?", "Indudablemente."]) + " <cr>");
         return false;
      }

      let tk = this.extract_tokens(input);

      // Order of resolution:
      // FIXME:
      // - first: winner (player or the person who you talk to)
      // - second: room action routing with m-beg param (ie. player is trapped in room)
      // - third: verb pre-action (ie. 'v-shoot' checks if user has a gun)

      // 1. Indirect Object
      if (tk.prsi && tk.prsi.obj.handle(tk.prsa, tk.prso, tk.prsi))
         return true;

      // 2. Direct Object
      if (tk.prso && tk.prso.obj.handle(tk.prsa, tk.prso, tk.prsi))
         return true;

      // 3. Verb
      if (tk.prsa && tk.prsa.obj.handle(tk.prsa, tk.prso, tk.prsi))
         return true;

      // last resort...
      tell("No conozco esa acción. <cr>");
      return false;
   }

   extract_tokens(user_input) {
      var result = {
         prsa: null,  // parser action (the verb)
         prso: null,  // parser direct object
         prsi: null,  // parser indirect object
      };

      // search for a known verb
      let input = user_input;
      for (let i in this.verbs) {
         let v = this.verbs[i];
         let r = v.syntax_match(input);
         if (r.match) {
            input = r.remain.trim();
            result.prsa = {obj: v, args: r.args, match: user_input.split(" ")[0]};
            break;
         }
      }

      // search for a direct object in current room or in player inventory
      let ro = this.player.room.find_match(input);
      if (!ro.match)
         ro = this.player.inventory.find_match(input);
      if (ro.match) {
         input = ro.remain.trim();
         result.prso = {obj: ro.object, holder: ro.holder};
      }
      else if (input)
         result.prso = {obj: new UknownObject(input)};

      // search for an indirect object in current room or player inventory (only if direct match)
      if (ro.match) {
         let ri = this.player.room.find_match(input)
         if (!ri.match)
            ri = this.player.inventory.find_match(input);
         if (ri.match) {
            result.prsi = {obj: ri.object, holder: ri.holder};
         }
         else if (input)
            result.prsi = {obj: new UknownObject(input)};
      }

      return result;
   }

   add_verb(verb) {
      if (this.verbs[verb.name]) {
         console.error(`verb already registered: ${verb.name}`);
         return;
      }
      this.verbs[verb.name] = verb;
   }

   set_initial_room(room) {
      this.initial_room = room;
      this.player.move(this.initial_room);
   }
};

// FIXME: add help command

zmac = new ZKMachine();
zmac.add_verb(new VerbMuteSound());

zmac.add_verb(new VerbInventory(zmac.player.inventory));
zmac.add_verb(new VerbPick(zmac.player.inventory));

zmac.add_verb(new VerbOpen());
zmac.add_verb(new VerbClose());
zmac.add_verb(new VerbPlace());
zmac.add_verb(new VerbPull());
zmac.add_verb(new VerbPush());
zmac.add_verb(new VerbActivate());

zmac.add_verb(new VerbLook(zmac.player));
zmac.add_verb(new VerbGoto("north", ["norte", "n"], zmac.player));
zmac.add_verb(new VerbGoto("south", ["sur", "s"], zmac.player));
zmac.add_verb(new VerbGoto("east", ["este", "e"], zmac.player));
zmac.add_verb(new VerbGoto("west", ["oeste", "o"], zmac.player));
zmac.add_verb(new VerbGoto("up", ["subir", "arriba", "ar"], zmac.player));
zmac.add_verb(new VerbGoto("down", ["bajar", "abajo", "ab"], zmac.player));
