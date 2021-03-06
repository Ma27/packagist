/*jslint nomen: true, browser: true*/
(function ($, humane) {
    "use strict";

    var versionCache = {},
        ongoingRequest = false;

    $('#add-maintainer').on('click', function (e) {
        $('#remove-maintainer-form').addClass('hidden');
        $('#add-maintainer-form').removeClass('hidden');
        e.preventDefault();
    });
    $('#remove-maintainer').on('click', function (e) {
        $('#add-maintainer-form').addClass('hidden');
        $('#remove-maintainer-form').removeClass('hidden');
        e.preventDefault();
    });

    $('.package .details-toggler').on('click', function () {
        var target = $(this);

        if (versionCache[target.attr('data-version-id')]) {
            $('.package .version-details').html(versionCache[target.attr('data-version-id')]);
        } else if (target.attr('data-load-more')) {
            if (ongoingRequest) { // TODO cancel previous requests instead?
                return;
            }
            ongoingRequest = true;
            $('.package .version-details').addClass('loading');
            $.ajax({
                url: target.attr('data-load-more'),
                dataType: 'json',
                success: function (data) {
                    versionCache[target.attr('data-version-id')] = data.content;
                    ongoingRequest = false;
                    $('.package .version-details')
                        .removeClass('loading')
                        .html(data.content);
                }
            });
        }

        $('.package .versions .open').removeClass('open');
        target.addClass('open');
    });

    // initializer for #<version-id> present on page load
    (function () {
        var hash = document.location.hash;
        if (hash.length > 1) {
            hash = hash.substring(1);
            $('.package .details-toggler[data-version-id="'+hash+'"]').click();
        }
    }());

    function dispatchAjaxForm(form, success, className) {
        var options = {
            cache: false,
            success: success,
            data: $(form).serializeArray(),
            type: $(form).attr('method'),
            url: $(form).attr('action')
        };
        if ($(form).is('.' + className)) {
            return;
        }
        $.ajax(options).complete(function () { $(form).removeClass(className); });
        $(form).addClass(className);
    }

    function forceUpdatePackage(e, updateAll) {
        var submit = $('input[type=submit]', '.package .force-update'), data;
        if (e) {
            e.preventDefault();
        }
        if (submit.is('.loading')) {
            return;
        }
        data = $('.package .force-update').serializeArray();
        if (updateAll) {
            data.push({name: 'updateAll', value: '1'});
        }
        $.ajax({
            url: $('.package .force-update').attr('action'),
            dataType: 'json',
            cache: false,
            data: data,
            type: $('.package .force-update').attr('method'),
            success: function () {
                document.location.reload(true);
            },
            context: $('.package .force-update')[0]
        }).complete(function () { submit.removeClass('loading'); });
        submit.addClass('loading');
    }
    $('.package .force-update').on('submit', forceUpdatePackage);
    $('.package .mark-favorite').on('click', function (e) {
        var options = {
            dataType: 'json',
            cache: false,
            success: function () {
                $(this).toggleClass('is-starred');
            },
            context: this
        };
        e.preventDefault();
        if ($(this).is('.loading')) {
            return;
        }
        if ($(this).is('.is-starred')) {
            options.type = 'DELETE';
            options.url = $(this).data('remove-url');
        } else {
            options.type = 'POST';
            options.data = {"package": $(this).data('package')};
            options.url = $(this).data('add-url');
        }
        $.ajax(options).complete(function () { $(this).removeClass('loading'); });
        $(this).addClass('loading');
    });
    $('.package .delete').on('submit', function (e) {
        e.preventDefault();
        if (window.confirm('Are you sure?')) {
            dispatchAjaxForm(this, function () {
                humane.log('Package successfully deleted', {timeout: 0, clickToClose: true});
                setTimeout(function () {
                    document.location.href = document.location.href.replace(/\/[^\/]+$/, '/');
                })
            }, 'request-sent');
        }
    });
    $('.package .delete-version .submit').on('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(e.target).closest('form').submit();
    });

    $('.package .delete-version').on('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var form = this;
        if (window.confirm('Are you sure?')) {
            dispatchAjaxForm(this, function () {
                humane.log('Version successfully deleted', {timeout: 3000, clickToClose: true});
                $(form).closest('.version').remove();
            }, 'request-sent');
        }
    });
    $('.package').on('click', '.requireme input', function () {
        this.select();
    });
    if ($('.package').data('force-crawl')) {
        forceUpdatePackage(null, true);
    }

    $('.readme a').on('click', function (e) {
        var targetEl,
            href = e.target.getAttribute('href');

        if (href.substr(0, 1) === '#') {
            targetEl = $(href);
            if (targetEl.length) {
                window.scrollTo(0, targetEl.offset().top - 70);
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
    });

    var versionsList = $('.package .versions')[0];
    if (versionsList.offsetHeight < versionsList.scrollHeight) {
        $('.package .versions-expander').removeClass('hidden').on('click', function () {
            $(this).addClass('hidden');
            $(versionsList).css('overflow-y', 'visible')
                .css('max-height', 'inherit');
        });
    }

    var readme = $('.package .readme')[0];
    if (readme && readme.offsetHeight < readme.scrollHeight) {
        $('.package .readme-expander').removeClass('hidden').on('click', function () {
            $(this).addClass('hidden');
            $(readme).css('overflow-y', 'visible')
                .css('max-height', 'inherit');
        });
        // auto-expand when contracting doesn't hide enough to make it worth it
        if (readme.offsetHeight > readme.scrollHeight - 200) {
            $('.package .readme-expander').click();
        }
    }
}(jQuery, humane));
