'use strict';

// =====================================================================
// EVENT BUS — 모듈 간 직접 참조 없이 통신
//
// 사용법:
//   GameEvents.on('all_enemies_dead', () => { ... });  // 리스너 등록
//   GameEvents.emit('all_enemies_dead', { data });      // 이벤트 발생
//   GameEvents.off('all_enemies_dead');                 // 리스너 전체 제거
//
// 현재 정의된 이벤트:
//   'enemy_killed'     — killEnemy() 호출 시. payload: { enemy, fromAlly }
//   'all_enemies_dead' — 살아있는 적이 0명이 됐을 때. payload: none
// =====================================================================
const GameEvents = {
    _listeners: {},

    on(ev, fn) {
        (this._listeners[ev] ??= []).push(fn);
    },

    emit(ev, data) {
        (this._listeners[ev] ?? []).forEach(fn => fn(data));
    },

    /** 해당 이벤트의 리스너 전체 제거 (맵 전환 시 정리용) */
    off(ev) {
        this._listeners[ev] = [];
    },
};
