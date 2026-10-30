(function () {
    'use strict';

    function init() {
        console.log('Lampa.AdBlock: Активация');

        // Эмуляция премиум-аккаунта (CUB / BWA)
        if (window.Account) {
            window.Account.hasPremium = function () {
                return true;
            };
        }

        // Блокировка рекламных оверлеев и авто-пропуск таймеров
        setInterval(function () {
            // Закрываем модальные окна таймеров/рекламы, если они появились
            var adModal = document.querySelector('.ad-modal, .preroll, .advert-box, [class*="ad-"]');
            if (adModal) {
                adModal.remove();
            }

            // Нажимаем кнопку "Пропустить" / "Skip", если плагин её создал
            var skipBtn = document.querySelector('.skip-button, .ad-skip, [class*="skip"]');
            if (skipBtn) {
                skipBtn.click();
            }
        }, 300);
    }

    // Регистрация в Lampa (необходимо для прохождения проверки /Lampa\./)
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
