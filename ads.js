(function () {
    'use strict';

    function init() {
        console.log('Lampa.AdBlock: Активация');

        // 1. Активируем вечный Premium в Lampa (отключает VAST-рекламу, прероллы и баннеры)
        var fakeUser = {
            id: 999999,
            user_id: 999999,
            email: 'premium@lampa.mx',
            premium: '2099-12-31',
            active: true,
            vip: true
        };

        try {
            if (window.Lampa && Lampa.Storage) {
                Lampa.Storage.set('account_user', fakeUser);
                Lampa.Storage.set('account_email', 'premium@lampa.mx');
                Lampa.Storage.set('developer_nopremium', false);

                // Перехватываем Storage.get для постоянной отдачи Premium
                var origGet = Lampa.Storage.get.bind(Lampa.Storage);
                Lampa.Storage.get = function (key, def) {
                    if (key === 'account_user') return fakeUser;
                    if (key === 'developer_nopremium') return false;
                    return origGet(key, def);
                };
            }
        } catch (e) {}

        // 2. Если есть доступ к Account.hasPremium — переопределяем напрямую
        try {
            if (window.Lampa && Lampa.Account) {
                Object.defineProperty(Lampa.Account, 'hasPremium', {
                    value: function () { return 99999; },
                    writable: true,
                    configurable: true
                });
            }
        } catch (e) {}

        // 3. Отключаем VAST-рекламу в плеере перед запуском
        try {
            if (window.Lampa && Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.follow('start', function (data) {
                    if (data) {
                        data.vast_url = false;
                        data.vast_banner = false;
                    }
                });
            }
        } catch (e) {}

        // 4. Заглушка для VASTPlayer и Google IMA (предотвращает падение и Script Error)
        window.VASTPlayer = function () {
            this.init = function () { return Promise.resolve(); };
            this.load = function () { return Promise.resolve(); };
            this.start = function () { return Promise.resolve(); };
            this.stop = function () {};
            this.destroy = function () {};
            this.on = function (event, cb) {
                if (event === 'ended' || event === 'complete' || event === 'adStop' || event === 'error') {
                    if (typeof cb === 'function') setTimeout(cb, 10);
                }
            };
        };

        window.google = window.google || {};
        window.google.ima = {
            AdDisplayContainer: function () {
                return { initialize: function () {}, destroy: function () {} };
            },
            AdsLoader: function () {
                return {
                    requestAds: function () {},
                    addEventListener: function (evt, cb) {
                        if (evt === 'adsManagerLoaded' || evt === 'allAdsCompleted') {
                            if (typeof cb === 'function') setTimeout(cb, 10);
                        }
                    },
                    destroy: function () {}
                };
            }
        };

        // 5. Перехват всплывающих рекламных окон и таймеров (мягко скрываем, без удаления элементов)
        setInterval(function () {
            try {
                // Если есть кнопка "Пропустить" / "Skip" — кликаем
                var skipBtn = document.querySelector('.ad-skip, .skip-button, [class*="skip"], .button--skip');
                if (skipBtn) {
                    skipBtn.click();
                }

                // Скрываем рекламный контейнер через CSS display: none (чтобы скрипты не ломались)
                var adBlocks = document.querySelectorAll('.ad-video-block, .ad-video-block__vast, .ad-modal, .ad-block');
                for (var i = 0; i < adBlocks.length; i++) {
                    adBlocks[i].style.display = 'none';
                }
            } catch (err) {}
        }, 200);

        // 6. Подавление всплывающего уведомления "Script Error"
        window.addEventListener('error', function (e) {
            if (e && (e.message === 'Script error.' || /vast|ima/i.test(e.filename || ''))) {
                e.preventDefault();
                e.stopPropagation();
                return true;
            }
        }, true);
    }

    // Регистрация плагина в Lampa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
