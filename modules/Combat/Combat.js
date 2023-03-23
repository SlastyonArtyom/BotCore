import AbstractModule from '#abstractModule';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import ModuleManager from '#moduleManager';

export default class Combat extends AbstractModule {
  #entityHurtEventId;
  #startedAttackingEventId;
  load () {
    const core = app();

    /** @type {import('mineflayer').Bot} */
    const bot = core.getClient();

    /** @type {import('#system-module/cli').default} */
    const cli = ModuleManager.getModule('cli');

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    this.#entityHurtEventId = core.registerClientEvent('entityHurt', entity => {
      if (entity === bot.entity) {
        const attacker = bot.nearestEntity(nearestEntity => nearestEntity.kind === 'Hostile mobs' || nearestEntity.type === 'player');
        bot.pvp.attack(attacker);
      }
    });

    this.#startedAttackingEventId = core.registerClientEvent('startedAttacking', function () {
      ModuleManager.getModule('DiscordNotify').send(`Начинает атаковать ${bot.pvp.target.displayName}`, '00ff00');
    });

    cli.addCommand('attack', function (line) {
      if (!bot.players[line]) {
        console.log('I can\'t see player');
        return;
      }

      bot.pvp.attackRange = 6;

      bot.pvp.attack(bot.players[line].entity);
    },
    function (trie, remove) {
      if (remove) {
        trie.remove('attack');
        return;
      }
      trie.insert('attack');
    });

    cli.addCommand('stopattack', function () {
      bot.pvp.stop();
    },
    function (trie, remove) {
      if (remove) {
        trie.remove('stopattack');
        return;
      }
      trie.insert('stopattack')
    });
  }

  unload () {
    app().unregisterClientEvent(this.#entityHurtEventId);
    app().unregisterClientEvent(this.#startedAttackingEventId);

    const cli = ModuleManager.getModule('cli');
    cli.removeCommand('attack');
    cli.removeCommand('stopattack');
  }
}
