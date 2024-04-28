// define objects ------------------------------------------------------------------
class ObjectMap extends GameObject {
   constructor() {
      super("map", "mapa", {male: true, one: true, take: true});

      this.adjective = "empapado";
      this.status = "no aguantará mucho";
   }

   describe(holder, extended) {
      if (extended)
         tell("Parace un mapa de la zona, hecho a mano e incompleto. <cr>");
      else if (holder.is.room)
         tell(`Hay un ${this.name} ${this.adjective} en el suelo, ${this.status}.`);
      else
         tell(`un ${this.name} ${this.adjective}`);
      return true;
   }

   handle(prsa, prso, prsi) {
      if (!prsa) {
         tell(random_choice([
            "¿Qué quieres que haga con el mapa? <cr>",
            "Sí, efectivamente, un mapa. <cr>",
         ]));
         return true;
      }
   }
};

// FIXME: move this to a common objects file
class Lever extends GameObject {
   constructor() {
      super("lever", "palanca de piedra", {male: false, one: true, take: true});
   }
};

// FIXME: move this to a common objects file
class LeverLock extends GameObject {
   constructor({on_activate}) {
      super("jail-lock", "mecanismo", {male: true, one: true, take: false});
      this.is.actionable = false;
      this._on_activate_cb = on_activate;
   }

   describe() {
      let ext = this.is.actionable ? "": ", pero necesitas algún objeto para activarlo";
      tell(`Hay un mecanismo en el suelo${ext}.`);
   }

   handle(prsa, prso, prsi) {
      if (prsa.obj instanceof VerbActivate) {
         if (!this.is.actionable)
            tell("El mecanismo está incompleto, no se puede activar.");
         else {
            tell("Empujas la palanca del mecanismo, y oyes el ruido de los engranajes. <cr>");
            this._on_activate_cb();
         }
      }

      else if (prsa.obj instanceof VerbPlace && prso.obj instanceof Lever) {
         tell("Colocas la palanca en el mecanismo. Al hacerlo, se oye un 'click'. <cr>");
         prso.holder.get(prso.obj.name);
         this.is.actionable = true;
      }
      else {
         tell(random_choice([
            "Creo que no puedes hacer eso.",
            "Eso no es posible.",
            "No way, bro.",
         ]));
      }

      return true;
   }
};

// FIXME: move this to a common objects file
class Door extends GameObject {
   constructor({on_open, on_close}) {
      super("door", "puerta", {male: false, one: true, can_open: true});
      this.is.open = false;
      this._on_open_cb = on_open;
      this._on_close_cb = on_close;
      this._update_desc();
   }

   _update_desc() {
      let state = this.is.open ? "abierta" : "cerrada";
      this.idesc = `La puerta de la valla está ${state}.`;
   }

   on_open() {
      this._on_open_cb();
      tell("Abres la puerta de la valla.");
      this._update_desc();
   }

   on_close() {
      this._on_close_cb();
      tell("Cierras la puerta.")
      this._update_desc();
   }
};

// FIXME: move this to a common objects file
class Chest extends Container {
   constructor(items) {
      super(items, "chest", "cofre", {male: true, one: true});
      this.is.open = false;
      this._update_desc();
   }

   _update_desc() {
      let state = this.is.open ? "abierto" : "cerrado";
      this.idesc = `Cerca de la pared del lado derecho hay un cofre ${state}.`;
   }

   on_open() {
      let msg = "Abres el cofre";
      if (!isEmpty(this.items))
         msg += ", descubriendo " + this.enumerate_items();
      tell(msg + ".<cr>");
      this._update_desc();
   }

   on_close() {
      tell("Cierras el cofre. <cr>");
      this._update_desc();
   }

   on_view() {
      let empty = isEmpty(this.items);
      if (!empty && this.is.open) {
         let msg = 'El cofre contiene ' + this.enumerate_items();
         tell(msg + ".<cr>");
      }
      else {
         let extra = empty ? ". Está vacío" : "";
         tell(`Un pequeño cofre de madera con un cierre metálico${extra}.<cr>`);
      }
   }

   handle(prsa, prso, prsi) {
      if (!prsa) {
         tell("Sí, es un cofre.<cr>");
         _("enum", this.enumerate_items());
         return true;
      }
      if (prsa.obj.name == "pick") {
         tell("Pesa demasiado como para cogerlo.<cr>");
         return true;
      }
      return false;
   }

   describe() {
      if (!Array.isArray(this.idesc))
         tell(this.idesc);
      else {
         for (let msg of this.idesc)
            tell(msg);
      }

      if (!isEmpty(this.items) && this.is.open)
         tell("Dentro hay " + this.enumerate_items() + ".");
      tell("<cr>");
      return true;
   }
};

// define places (or rooms) --------------------------------------------------------
class Grounds extends Room {
   constructor(items) {
      super(items);

      this.effects = ["rain"];
      this.ambient = "rain-storm";
   }
}

class RoomEastOfHouse extends Grounds {
   constructor() {
      super({
         door: new Door({
            on_open: () => this.locked_exits.north = false,
            on_close: () => this.locked_exits.north = true,
         }),
      });
   }

   init() {
      this.desc = [
         "Estás en la parte este de la casa. El camino continúa detrás de una valla de madera. <cr>"
      ];
      this.exits = {
         north: RoomDogsJail.ref(),
         south: RoomSouthOfHouse.ref(),
         east: RoomEastOfHouse.ref(),
      };
      this.locked_exits = {north: true};
      this.background = "00000004.jpg";
   }
};

class RoomDogsJail extends Grounds {
   constructor() {
      super({
         lock: new LeverLock({
            on_activate: () => {
               tell("¡Enhorabuena! Has conseguido liberar al perro de Luca. Juntos, " +
                  "avanzaréis por senderos inhóspitos... " +
                  "¿A qué nuevas aventuras os conducirán? ;)<cr>"
               );
               tell("¡Muchas gracias por jugar!<cr>");
               the_end();
            }
         })
      });
   }

   init() {
      this.desc =
         "Estás en la parte trasera de la casa. Puedes ver a un perrete metido en una jaula. <cr>";
      this.exits = {
         south: RoomHouse.ref(),
         east: RoomEastOfHouse.ref(),
      };
      this.background = "00000005.jpg";
   }
};

class RoomHouse extends Room {
   constructor() {
      super({
         chest: new Chest({
            lever: new Lever(),
         }),
      });
   }

   init() {
      this.desc = [
         "Estás dentro de la casa, en la estancia principal. Un cálido fuego " +
         "crepita en la chimenea.<cr> ",
      ];
      this.exits = {
         south: RoomSouthOfHouse.ref(),
         north: RoomDogsJail.ref(),
      };
      this.locked_exits = {north: true};
      this.ambient = "fireplace";
      this.background = "00000003.jpg";
   }
};

class RoomSouthOfHouse extends Grounds {
   init() {
      let extra = random_choice([" y sigue lloviendo a cántaros", ""]);
      this.desc = [
         `Sales a un claro del bosque${extra}. `,
         "Delante de ti hay una casa de madera y piedra, un tanto descuidada.<cr>",
      ];
      this.exits = {
         north: RoomHouse.ref(),
         south: RoomForest.ref(),
         west: RoomSouthOfHouse.ref(),
         east: RoomEastOfHouse.ref(),
      };
      this.background = "00000002.jpg";
   }
};

class RoomForest extends Grounds {
   constructor() {
      super({
         map: new ObjectMap(),
      });
   }

   init() {
      this.desc = [
         "Estás en un bosque muy denso, y llueve a cántaros. " +
         "Entre la espesura vislumbras un sendero que se dirige hacia el norte.<cr>"
      ];
      this.exits = {
         north: RoomSouthOfHouse.ref(),
      };
      this.background = "00000001.jpg";
   }
};

zmac.set_initial_room(RoomForest.ref());

// TODO:
// - permitir soltar un objeto en cualquier room
// - añadir un ladrido aleatorio en la sala del perro
// - añadir truenos aleatorios
// - oir la lluvia en la cabaña, pero mucho más leve
// - comando para ajustar el nivel del audio (con un valor entre 0 y 100)
// - permitir artículos (el, la, los, las, un, una, unos, unas)
// - permitir preposiciones básicas (en)
// - reproducir sonido cuando se coloca la palanca
// - permitir mostrar el mapa
// - mostrar inventario al lanzar el comando (se oculta en el siguiente comando)
// - mostrar una barra de vida (a lo MC), que se va reduciendo con cada comando
// - incluir comandos para regenerar vida (comer)
// - guardar historial de comandos, y poder navegar por el, usando las flechas

// * CAPTURAS:
//    - puerta de la valla abierta/cerrada: cambiar background
//    - mostrar el mecanismo donde se debe colocar la palanca
