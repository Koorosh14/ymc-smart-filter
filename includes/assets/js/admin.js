;
(function( $ ) {
    "use strict"

    $(document).on('ready', function () {

        // Path preloader image
        const pathPreloader = _smart_filter_object.path+"/includes/assets/images/preloader.svg";

        // Wrapper tab
        const container   = $('.ymc__container-settings .tab-panel');

        document.querySelectorAll('.ymc__container-settings .nav-tabs .link').forEach((el) => {

            el.addEventListener('click',function (e) {
                e.preventDefault();

                let hash = this.hash;

                let text = $(this).find('.text').text();

                $('.ymc__header .manage-dash .title').text(text);

                $(el).addClass('active').closest('.nav-item').siblings().find('.link').removeClass('active');

                document.querySelectorAll('.tab-content .tab-panel').forEach((el) => {

                    if(hash === '#'+el.getAttribute('id')) {
                        $(el).addClass('active').siblings().removeClass('active');
                    }

                });

            });

        });

        // CPT Event
        $(document).on('change','.ymc__container-settings #general #ymc-cpt-select',function (e) {

            let taxonomyWrp = $('#ymc-tax-checkboxes');
            let termWrp     = $('#ymc-terms');
            let choicesList = $('#selection-posts .choices-list');
            let valuesList  = $('#selection-posts .values-list');

            const data = {
                'action': 'ymc_get_taxonomy',
                'nonce_code' : _smart_filter_object.nonce,
                'cpt' : $(this).val(),
                'post_id' : $(this).data('postid')
            };

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: _smart_filter_object.ajax_url,
                data: data,
                beforeSend: function () {
                    container.addClass('loading').
                    prepend(`<img class="preloader" src="${pathPreloader}">`);
                },
                success: function (res) {

                    container.removeClass('loading').find('.preloader').remove();

                    let dataTax = (JSON.parse(res.data));

                    // Get Taxonomies
                    if(Object.keys(dataTax).length > 0) {

                        taxonomyWrp.html('');
                        termWrp.html('').closest('.wrapper-terms').addClass('hidden');

                        for (let key in dataTax) {

                            taxonomyWrp.append(`<div id="${key}" class="group-elements" draggable="true">
                            <input id="id-${key}" type="checkbox" name="ymc-taxonomy[]" value="${key}">
                            <label for="id-${key}">${dataTax[key]}</label>
                            </div>`);
                        }
                    }
                    else  {

                        taxonomyWrp.html('').append(`<span class="notice">No data for Post Type / Taxonomy</span>`);
                        termWrp.html('').closest('.wrapper-terms').addClass('hidden');
                    }

                    // Get posts
                    let dataPosts = (JSON.parse(res.lists_posts));

                    valuesList.empty();
                    choicesList.empty();

                    if(Object.keys(dataPosts).length > 0) {
                        for (let key in dataPosts) {
                            choicesList.append(dataPosts[key]);
                        }
                    }
                    else {
                        choicesList.html(`<li class="notice">No posts</li>`);
                    }
                },
                error: function (obj, err) {
                    console.log( obj, err );
                }
            });
        });

        // Taxonomy Event
        $(document).on('click','.ymc__container-settings #general #ymc-tax-checkboxes input[type="checkbox"]',function (e) {

            let termWrp = $('#ymc-terms');

            let val = '';

            if($(e.target).is(':checked')) {

                val = $(e.target).val();

                const data = {
                    'action': 'ymc_get_terms',
                    'nonce_code' : _smart_filter_object.nonce,
                    'taxonomy' : val
                };

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: _smart_filter_object.ajax_url,
                    data: data,
                    beforeSend: function () {
                        container.addClass('loading').
                        prepend(`<img class="preloader" src="${pathPreloader}">`);
                    },
                    success: function (res) {

                        container.removeClass('loading').find('.preloader').remove();

                        if($(e.target).closest('.ymc-tax-checkboxes').find('input[type="checkbox"]:checked').length > 0) {
                            $('.ymc__container-settings #general .wrapper-terms').removeClass('hidden');
                        } else {
                            $('.ymc__container-settings #general .wrapper-terms').addClass('hidden');
                        }

                        // Get Terms
                        if( res.data.terms.length ) {

                            let output = '';

                            output += `<article class="group-term item-${val}">
                                       <div class="item-inner all-categories">
                                       <input name='all-select' class='category-all' id='category-all-${val}' type='checkbox'>
                                       <label for='category-all-${val}' class='category-all-label'>All [ ${$(e.target).siblings('label').text()} ]</label></div>
                                       <div class="entry-terms">`;

                            res.data.terms.forEach((el) => {
                                output += `<div class='item-inner' data-termid='${el.term_id}'>
                                <input name="ymc-terms[]" class="category-list" id="category-id-${el.term_id}" type="checkbox" value="${el.term_id}">
                                <label for='category-id-${el.term_id}' class='category-list-label'>${el.name}</label>
                                <i class="far fa-cog choice-icon" title="Setting term"></i>
                                <span class="indicator-icon"></span>                                
                                </div>`;
                            });

                            output += `</div></article>`;

                            termWrp.append(output);

                            output = '';

                            sortTerms();

                            updateSortTerms();
                        }
                        else  {
                            termWrp.append(`<article class="group-term item-${val}">
                            <div class='item-inner notice-error'>No terms for taxonomy <b>${$(e.target).siblings('label').text()}</b></div></article>`);
                        }
                    },
                    error: function (obj, err) {
                        console.log( obj, err );
                    }
                });
            }
            else {
                termWrp.find('.item-'+$(e.target).val()).remove();
            }

        });

       // Reload Taxonomy
        $(document).on('click','.ymc__container-settings #general .tax-reload',function (e) {
            $('.ymc__container-settings #general #ymc-cpt-select').trigger('change')
        });

        // Drag & Drop Sort Taxonomy
        function sortTaxonomy() {

            let taxListElement = document.querySelector('#ymc-tax-checkboxes');

            if( taxListElement ) {

                let taxElements = taxListElement.querySelectorAll('.group-elements');

                for (let tax of taxElements) {
                    tax.draggable = true;
                }

                taxListElement.addEventListener('dragstart', (evt) => {
                    evt.target.classList.add('selected');
                });

                taxListElement.addEventListener('dragend', (evt) => {
                    evt.target.classList.remove('selected');

                    let arrTax = [];

                    taxListElement.querySelectorAll('.group-elements').forEach((el) => {
                        arrTax.push(el.id);
                    });

                    let data = {
                        'action': 'ymc_tax_sort',
                        'nonce_code' : _smart_filter_object.nonce,
                        'tax_sort' : JSON.stringify(arrTax),
                        'post_id' : taxListElement.dataset.postid
                    };

                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: _smart_filter_object.ajax_url,
                        data: data,
                        success: function (res) {},
                        error: function (obj, err) {
                            console.log( obj, err );
                        }
                    });
                });

                let getNextElement = (cursorPosition, currentElement) => {
                    let currentElementCoord = currentElement.getBoundingClientRect();
                    let currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;
                    return (cursorPosition < currentElementCenter) ?
                        currentElement :
                        currentElement.nextElementSibling;
                };

                taxListElement.addEventListener('dragover', (evt) => {
                    evt.preventDefault();

                    const activeElement = taxListElement.querySelector(`.selected`);

                    const currentElement = evt.target;

                    const isMoveable = activeElement !== currentElement &&
                        currentElement.classList.contains('group-elements');

                    if (!isMoveable) {
                        return;
                    }

                    const nextElement = getNextElement(evt.clientY, currentElement);

                    if (
                        nextElement &&
                        activeElement === nextElement.previousElementSibling ||
                        activeElement === nextElement
                    ) {
                        return;
                    }

                    taxListElement.insertBefore(activeElement, nextElement);
                });

            }

        }
        sortTaxonomy();


        // Drag & Drop Sort Terms
        function updateSortTerms() {

            let arrTerms = [];

            document.querySelectorAll('#ymc-terms .item-inner:not(.all-categories)').forEach((el) => {
                arrTerms.push(el.children[0].value);
            });

            let data = {
                'action': 'ymc_term_sort',
                'nonce_code' : _smart_filter_object.nonce,
                'term_sort' : JSON.stringify(arrTerms),
                'post_id' : document.querySelector('#ymc-terms').dataset.postid
            };

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: _smart_filter_object.ajax_url,
                data: data,
                success: function (res) {},
                error: function (obj, err) {
                    console.log( obj, err );
                }
            });
        }

        // Drag & Drop selected posts
        function sortSelectedPosts() {

            let postListElement = document.querySelector('#selection-posts .include-posts');

            if( postListElement ) {

                let postElement = postListElement.querySelectorAll('li');

                for (let post of postElement) {
                    post.draggable = true;
                }

                postListElement.addEventListener('dragstart', (evt) => {
                    evt.target.classList.add('selected');
                });
                postListElement.addEventListener('dragend', (evt) => {
                    evt.target.classList.remove('selected');
                });

                let getNextElement = (cursorPosition, currentElement) => {
                    let currentElementCoord = currentElement.getBoundingClientRect();
                    let currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;
                    return (cursorPosition < currentElementCenter) ?
                        currentElement :
                        currentElement.nextElementSibling;
                };

                postListElement.addEventListener('dragover', (evt) => {
                    evt.preventDefault();

                    const activeElement = postListElement.querySelector(`.selected`);

                    const currentElement = evt.target.parentNode;

                    const isMoveable = activeElement !== currentElement;

                    if (!isMoveable) {
                        return;
                    }

                    const nextElement = getNextElement(evt.clientY, currentElement);

                    if (
                        nextElement &&
                        activeElement === nextElement.previousElementSibling ||
                        activeElement === nextElement
                    ) {
                        return;
                    }

                    evt.target.parentNode.parentNode.insertBefore(activeElement, nextElement);
                });
            }
        }
        sortSelectedPosts();


        function sortTerms() {

            let termListElement = document.querySelector('#ymc-terms');

            if( termListElement ) {

                let termElements = termListElement.querySelectorAll('.item-inner:not(.all-categories)');

                for (let term of termElements) {
                    term.draggable = true;
                }

                termListElement.querySelectorAll('.entry-terms').forEach((el) => {

                    el.addEventListener('dragstart', (evt) => {
                        evt.target.classList.add('selected');
                    });

                    el.addEventListener('dragend', (evt) => {
                        evt.target.classList.remove('selected');
                        updateSortTerms();
                    });
                });

                let getNextElement = (cursorPosition, currentElement) => {
                    let currentElementCoord = currentElement.getBoundingClientRect();
                    let currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;
                    return (cursorPosition < currentElementCenter) ?
                        currentElement :
                        currentElement.nextElementSibling;
                };

                termListElement.querySelectorAll('.entry-terms').forEach((el) => {
                    el.addEventListener('dragover', (evt) => {
                        evt.preventDefault();

                        const activeElement = termListElement.querySelector(`.selected`);

                        const currentElement = evt.target;

                        const isMoveable = activeElement !== currentElement &&
                            currentElement.classList.contains('item-inner');

                        if (!isMoveable) {
                            return;
                        }

                        const nextElement = getNextElement(evt.clientY, currentElement);

                        if (
                            nextElement &&
                            activeElement === nextElement.previousElementSibling ||
                            activeElement === nextElement
                        ) {
                            return;
                        }

                        evt.target.parentNode.insertBefore(activeElement, nextElement);
                    });
                });
            }
        }
        sortTerms();


        // Choices Posts
        $('.wrapper-selection .ymc-exclude-posts').on('click', function (e) {

            let listItems = $('.selection-posts .values .values-list');

            if($(e.target).prop('checked')) {
                listItems.removeClass('include-posts').addClass('exclude-posts');
            }
            else {
                listItems.removeClass('exclude-posts').addClass('include-posts');
            }
        });

        $(document).on('click','#selection-posts .choices-list .ymc-rel-item-add', function (e) {

            let postID = e.target.dataset.id;
            let titlePosts = e.target.innerText;
            e.target.classList.add('disabled');

            let valuesList = $('#selection-posts .values-list');
            valuesList.addClass('include-posts');

            valuesList.append(`<li><input type="hidden" name="ymc-choices-posts[]" value="${postID}">
					<span  class="ymc-rel-item" data-id="${postID}">${titlePosts}
                    <a href="#" class="ymc-icon-minus remove_item"></a>
                    </span></li>`);

            sortSelectedPosts();
        });

        $(document).on('click','#selection-posts .values-list .remove_item', function (e) {
            e.preventDefault();

            let postID = $(e.target).closest('.ymc-rel-item').data('id');

            $('#selection-posts .choices-list .ymc-rel-item-add').each(function (){
                if( postID === $(this).data('id')) {
                    $(this).removeClass('disabled');
                }
            });

            if( $(e.target).closest('.values-list').find('li').length - 1 === 0 ) {

                const data = {
                    'action': 'ymc_delete_choices_posts',
                    'nonce_code' : _smart_filter_object.nonce,
                    'post_id' : $('#ymc-cpt-select').data('postid')
                };

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: _smart_filter_object.ajax_url,
                    data: data,
                    beforeSend: function () {
                        container.addClass('loading').
                        prepend(`<img class="preloader" src="${pathPreloader}">`);
                    },
                    success: function (res) {
                        container.removeClass('loading').find('.preloader').remove();
                    },
                    error: function (obj, err) {
                        console.log( obj, err );
                    }
                });

            }

            $(e.target).closest('li').remove();

        });


        // Open Popup for choices icon
        $(document).on('click','#general #ymc-terms .entry-terms .choice-icon', function (e) {

            $('#ymc-terms .entry-terms .item-inner').removeClass('open-popup');

            $(e.target).closest('.item-inner').addClass('open-popup');

            let alignterm = e.target.closest('.item-inner').dataset.alignterm;

            let newIcon = $(e.target).siblings('.indicator-icon').find('i').clone(true).css('color','red');

            tb_show( 'Choose Icon', '/?TB_inline&inlineId=ymc-icons-modal&width=740&height=768' );

            if( newIcon.length > 0 ) {
                $( '#TB_ajaxContent .ymc-icons-content .panel-setting .remove-link' ).show().find('i').remove();
                newIcon.insertBefore( '#TB_ajaxContent .ymc-icons-content .panel-setting .remove-link .text' );
            }
            else {
                $( '#TB_ajaxContent .ymc-icons-content .panel-setting .remove-link' ).hide();
            }

            $('#TB_ajaxContent .ymc-icons-content .panel-setting .toggle-align-icon[data-align="'+alignterm+'"]').
                addClass('selected').siblings().removeClass('selected');
        });

        // Add Icon
        $(document).on('click','#TB_ajaxContent .ymc-icons-content .icons-entry i', function (e) {

            $('#TB_ajaxContent .ymc-icons-content .icons-entry i').removeClass('result').show();
            $('#TB_ajaxContent .ymc-icons-content .panel-setting input[type="search"]').val('');

            let classIcon = $(e.target).attr('class');

            let termId = $('#ymc-terms .entry-terms .open-popup').data('termid');

            let iconHtml = `<i class="${classIcon}"></i><input name="ymc-terms-icons[${termId}]" type="hidden" value="${classIcon}">`;

            $('#ymc-terms .entry-terms .open-popup .indicator-icon').html(iconHtml).closest('.item-inner').removeClass('open-popup');

            tb_remove();
        });

        // Remove icon
        $(document).on('click','#TB_ajaxContent .ymc-icons-content .remove-link', function (e) {

            $('#ymc-terms .entry-terms .open-popup .indicator-icon').empty().closest('.item-inner').removeClass('open-popup');

            // If no icons for terms
            if ($('#ymc-terms .entry-terms .indicator-icon').find('input').length === 0) {

                const data = {
                    'action': 'ymc_delete_choices_icons',
                    'nonce_code' : _smart_filter_object.nonce,
                    'post_id' : $('#ymc-cpt-select').data('postid')
                };

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: _smart_filter_object.ajax_url,
                    data: data,
                    beforeSend: function () {
                        container.addClass('loading').
                        prepend(`<img class="preloader" src="${pathPreloader}">`);
                    },
                    success: function (res) {
                        container.removeClass('loading').find('.preloader').remove();
                    },
                    error: function (obj, err) {
                        console.log( obj, err );
                    }
                });
            }

            tb_remove();
        });

        // Search Icon
        $(document).on('input','#TB_ajaxContent .ymc-icons-content input[type="search"]', function (e) {

            let keyword = e.target.value.toLowerCase();
            let arrIcons = [];

            if( keyword.length >= 3 ) {

                document.querySelectorAll('#TB_ajaxContent .ymc-icons-content .icons-entry i').forEach((el) => {

                    let nameClass = $(el).attr('class').replace(/[\s.-]/g, ' ');

                    if(nameClass.includes(keyword)) {
                        arrIcons.push(el);
                    }
                });

                if( arrIcons.length > 0 ) {
                    arrIcons.forEach((elem) => {
                        elem.classList.add('result');
                    });
                    $('#TB_ajaxContent .ymc-icons-content .icons-entry i:not(.result)').hide();
                    $('#TB_ajaxContent .ymc-icons-content .icons-entry i.result').show();
                }
                else {
                    $('#TB_ajaxContent .ymc-icons-content .icons-entry i').hide();
                }
            }
            else {
                $('#TB_ajaxContent .ymc-icons-content .icons-entry i').removeClass('result').show();
            }

        });

        // Set align icon for Terms
        $(document).on('click','#TB_ajaxContent .ymc-icons-content .panel-setting .align-icon .toggle-align-icon', function (e) {
            e.preventDefault();

            let termAlign = $(e.target).closest('.toggle-align-icon').data('align');

            let arrAlignTerms = [];

            $(e.target).closest('.toggle-align-icon').addClass('selected').siblings().removeClass('selected');

            document.querySelector('#ymc-terms .entry-terms .open-popup').dataset.alignterm = termAlign;

            document.querySelectorAll('#ymc-terms .entry-terms .item-inner').forEach((el) => {
                let termId = el.dataset.termid;
                let termAlign = el.dataset.alignterm;
                arrAlignTerms.push({ "termid" : termId, "alignterm" : termAlign });
            });

            const data = {
                'action' : 'ymc_terms_align',
                'nonce_code' : _smart_filter_object.nonce,
                'post_id' : $('#ymc-cpt-select').data('postid'),
                'params'  : JSON.stringify(arrAlignTerms)
            };

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: _smart_filter_object.ajax_url,
                data: data,
                beforeSend: function () {
                    container.addClass('loading').
                    prepend(`<img class="preloader" src="${pathPreloader}">`);
                },
                success: function (res) {

                    container.removeClass('loading').find('.preloader').remove();

                    $(e.target).closest('.toggle-align-icon').find('.note').css({'opacity':'1'});

                    setTimeout(() => {
                        $(e.target).closest('.toggle-align-icon').find('.note').css({'opacity':'0'});
                        //tb_remove();
                    },1000);

                },
                error: function (obj, err) {
                    console.log( obj, err );
                }
            });
        });

        // Selected All Terms
        $(document).on('click','.ymc__container-settings #general #ymc-terms .all-categories input[type="checkbox"]',function (e) {

            let input = $(e.target);

            let checkbox = input.closest('.all-categories').siblings().find('input[type="checkbox"]');

            if( input.is(':checked') ) {

                if( ! checkbox.is(':checked') ) {
                    checkbox.prop( "checked", true );
                }
            }
            else  {
                checkbox.prop( "checked", false );
            }
        });

        // Set checkbox All marked
        $('#general #ymc-terms .group-term').each(function () {
            let total = $(this).find('input[type="checkbox"]').length - 1;
            let totalChecked = $(this).find('input[checked]').length;
            if(total === totalChecked) {
                $(this).find('.all-categories input[type="checkbox"]').attr('checked','checked');
            }
        });

        // Toggle Filter Status
        $(document).on('click', '.ymc__container-settings .ymc-toggle-group .slider', function (e) {

            let input = $(e.target).siblings('input');

           // ( input.is(':checked') ) ? input.siblings('input[type="hidden"]').val('on') : input.siblings('input[type="hidden"]').val('off');

            if(input.is(':checked')) {
                input.siblings('input[type="hidden"]').val('on').closest('.form-group').find('.manage-filters').show();
            }
            else  {
                input.siblings('input[type="hidden"]').val('off').closest('.form-group').find('.manage-filters').hide();
            }

        });

        // Sort by Fields
        $('.appearance-section #ymc-order-post-by').change(function(e) {
            let metaSort = $(e.target).closest('.from-element').siblings('.from-element--meta-sort');
            let multipleSort = $(e.target).closest('.from-element').siblings('.from-element--multiple-sort');
            let orderSort = $(e.target).closest('.from-element').siblings('.from-element--order-sort');

            metaSort.hide();
            multipleSort.hide();
            orderSort.show();

            switch ( this.value ) {

                case 'meta_key' : metaSort.show();  break;

                case 'multiple_fields' : multipleSort.show(); orderSort.hide(); break;

            }
        });

        // Event handler Add Multiple Fields
        $('.appearance-section .from-element--multiple-sort .btnAddMultipleSort').click(function (e) {
            let length = $(e.target).closest('.from-element').find('.rows-options').length;
            let rowCloneHtml = $($(e.target).closest('.from-element').find('.rows-options')[length - 1]).clone(true);
            $(e.target).closest('.from-element').find('.ymc-btn').before(rowCloneHtml);

           let newItem = $($(e.target).closest('.from-element').find('.rows-options')[length]);
           newItem.find('.ymc-multiple-orderby').attr('name','ymc-multiple-sort['+length+'][orderby]');
           newItem.find('.ymc-multiple-order').attr('name','ymc-multiple-sort['+length+'][order]');

            $(this).siblings('.btnRemoveMultipleSort').show();
        });

        // Event handler Remove Multiple Fields
        $('.appearance-section .from-element--multiple-sort .btnRemoveMultipleSort').click(function (e) {
            let length = $(e.target).closest('.from-element').find('.rows-options').length;

            if( length > 1 ) {
                $($(e.target).closest('.from-element').find('.rows-options')[length - 1]).remove();
            }
            if( length - 1 === 1 ) {
                $(this).hide();
            }
        });


        // Set Cookie
        function setCookie(cname, cvalue, exdays) {
            let d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            let expires = "expires="+ d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        }

        // Set Style Preloader
        $(document).on('change', '#ymc-preloader-icon', function (e) {
            let preloaderURL = _smart_filter_object.path + "/includes/assets/images/" + $(this).val() + '.svg';
            $(this).closest('#ymc-preloader-icon').next('.preview-preloader').find('img').attr('src', preloaderURL);
        });

        // Get Cookie
        function getCookie(cname) {
            let name = cname + "=";
            let decodedCookie = decodeURIComponent(document.cookie);
            let ca = decodedCookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        // Set Cookie for Tab
        $(".ymc__container-settings #ymcTab a").click(function(e) {
            let hashUrl = $(this).attr('href');
            setCookie("hashymc", hashUrl,30);
        });

        // Display selected tab
        if(getCookie("hashymc") !== '') {

            let hash = getCookie("hashymc");

            $('.ymc__container-settings .nav-tabs a[href="' + hash + '"]').
                addClass('active').
                closest('.nav-item').
                siblings().
                find('.link').
                removeClass('active');

            document.querySelectorAll('.tab-content .tab-panel').forEach((el) => {
                if(hash === '#'+el.getAttribute('id')) {
                    $(el).addClass('active').siblings().removeClass('active');
                }
            });
        }

        // Add Color Picker for all inputs
        $('.ymc-custom-color').wpColorPicker();

    });

}( jQuery ));