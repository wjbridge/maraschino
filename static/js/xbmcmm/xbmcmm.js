$(document).ready(function() {

  // Switch XBMC Server
  $(document).on('click', '.switch_server', function() {
    var li = $(this);

    $.get(WEBROOT + '/xhr/switch_server/' + $(this).data('server_id'), function(data) {
      if (data.status === 'error') {
        alert_popup('error', 'There was an error switching XBMC servers.');
        return;
      }

      window.location.reload();
    });
  });

  // Alert
  function alert_popup(status, msg) {
    var popup = $('<div class="alert alert-'+status+' span3"><a class="close" data-dismiss="alert" href="#">×</a>'+msg+'</div>');
    $('body').append(popup);
    setTimeout(
      function() {
        $(popup).fadeOut("slow", function() {
          $(popup).remove();
        });
      }, 3000
    );
  }

  // Replace image
  function replace_img(type, new_src) {
    $('.'+type+'_thumb img').replaceWith(
      $('<img />', {'src': WEBROOT+'/static/images/xhrloading2.gif', 'id': type+'_img'})
    );

    var newImg = new Image();
    newImg.src = new_src;
    newImg.id = type+"_img";
    newImg.onload = function(){
      $('.'+type+'_thumb img').replaceWith(this);
    }
  }

  // Image URL
  $(document).on('click', '.url_btn', function() {
    $.get(WEBROOT + '/xhr/xbmcmm_url/' + $(this).data('type'), function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.url_save', function() {
    var type = $(this).data('type');
    var url = $('#modal_template #' + type + '_url').val();
    var img, form_img;

    if (type == 'episode_thumb') {
      img = $('.episode_details #thumb_img');
      form_img = $('.episode_details #id_thumbnail');
    }
    else {
      img = $('#'+type+'_img');
      form_img = $('#id_'+type);
    }

    $('#modal_template').modal('hide');
    form_img.val(url);
    replace_img(type, url);
  });

  // image save
  $(document).on('click', '.modal_images img', function() {
    var url = $(this).data('url');
    var type = $(this).data('type');
    var img = $('.details #'+type+'_img');
    var new_src = WEBROOT + '/cache/image_url/' + url.replace('http://', '');

    $('#modal_template').modal('hide');
    $('#id_'+type).val(url);
    replace_img(type, new_src);
  });

  // fanart.tv
  $(document).on('click', '.fanarttv_btn', function() {
    var btn = $(this);
    var id = $('.details form #id_imdbnumber').val();
    btn.button('loading');
    $.get(WEBROOT + '/xhr/fanarttv/' + btn.data('media') + '/' + btn.data('type') + '/' + id, function(data) {
      if (!data.error) {
        $('#modal_template').replaceWith(data);
        $('#modal_template').modal('show');
      }
      else {
        alert_popup('error', data.error);
      }
      btn.button('reset');
    });
  });

  // tmdb
  $(document).on('click', '.tmdb_info_btn', function() {
    var btn = $(this);
    var id = $('.details form #id_imdbnumber').val();
    btn.button('loading');
    $.get(WEBROOT + '/xhr/tmdb/' + id, function(data) {
      if (!data.error) {
        $('#modal_template').replaceWith(data);
        $('#modal_template').modal('show');
      }
      else {
        alert_popup('error', data.error);
      }
      btn.button('reset');
    });
  });

  $(document).on('click', '.tmdb_img_btn', function() {
    var btn = $(this);
    var id = $('.details form #id_imdbnumber').val();
    btn.button('loading');
    $.get(WEBROOT + '/xhr/tmdb/images/'+ btn.data('type') + '/' + id, function(data) {
      if (!data.error) {
        $('#modal_template').replaceWith(data);
        $('#modal_template').modal('show');
      }
      else {
        alert_popup('error', data.error);
      }
      btn.button('reset');
    });
  });

  // tvdb
  $(document).on('click', '.tvdb_info_btn', function() {
    var btn = $(this);
    var title = $('.details form #id_title').val();
    var id = $('.details form #id_imdbnumber').val();

    btn.button('loading');
    $.get(WEBROOT + '/xhr/tvdb_show/' + title + '/' + id, function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
      btn.button('reset');
    });
  });

  $(document).on('click', '.tvdb_img_btn', function() {
    var btn = $(this);
    var type = btn.data('type');
    var title = $('.details form #id_title').val();
    var id = $('.details form #id_imdbnumber').val();

    btn.button('loading');
    $.get(WEBROOT + '/xhr/tvdb_show/' + title + '/' + id + '?images=' + type, function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
      btn.button('reset');
    });
  });

  $(document).on('click', '.tvdb_show_list li', function(){
    var title = $(this).data('title');
    var id = $(this).data('id');
    $.get(WEBROOT + '/xhr/tvdb_show/' + title + '/' + id, function(data) {
      $('#modal_template').modal('hide');
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.tvdb_episode_info_btn', function() {
    var btn = $(this);
    var tvshowid = $('.episode_details #media_id').data('tvshowid');
    var episode = $('.episode_details #id_episode').val();
    var season = $('.episode_details #id_season').val();

    btn.button('loading');
    $.get(WEBROOT + '/xhr/tvdb_episode/' + tvshowid + '/' + season + '/' + episode, function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
      btn.button('reset');
    });
  });

  // Scraped info save
  $(document).on('click', '.scrape_info_save_btn', function() {
    $('.scrape_info_form .controls').children().each(function() {
      if (!$(this).val() == '') {
        $('form #id_'+$(this).attr('id')).val($(this).val());
      }
    });
    $('#modal_template').modal('hide');
  });

  // Scraped episode info save
  $(document).on('click', '.scrape_info_episode_save_btn', function() {
    var img_checkbox = $('.scrape_info_form .controls #thumbnail');
    var img = $('.episode_details #thumbnail_img');

    if (!img_checkbox.is(':checked')) {
      img_checkbox.val('');
    }
    else {
      replace_img('thumb', WEBROOT+'/cache/image_url/'+img_checkbox.val().replace('http://', ''));
    }

    $('.scrape_info_form .controls').children().each(function() {
      if (!$(this).val() == '') {
        $('.episode_details form #id_'+$(this).attr('id')).val($(this).val());
      }
    });


    $('#modal_template').modal('hide');
  });

  // Filesystem
  var file_type = '';

  $(document).on('click', '.file_btn', function() {
    file_type = $(this).data('type');
    $.get(WEBROOT + '/xhr/filesystem/', function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.file_list .path', function(){
    var path = $(this).data('path');
    $.post(WEBROOT + '/xhr/filesystem/',{path: encodeURI(path)}, function(data){
      $('#modal_template').modal('hide');
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.file_list .file', function(){
    $('#modal_template .file').removeClass('active');
    $(this).addClass('active');
    $('.file_save_btn').removeClass('hide');
  });

  $(document).on('click', '.file_save_btn', function(){
    var path = $('.file_list').children('.active').data('path');
    var url = WEBROOT + '/cache/image_file/'+ os +'/' + path;
    var img, form_img;

    if (file_type == 'thumb') {
      img = $('.episode_details #thumb_img');
      form_img = $('.episode_details #id_thumbnail');
    }
    else {
      img = $('#'+file_type+'_img');
      form_img = $('#id_'+file_type);
    }

    if (path.charAt(0) == '/') {
      var os = 'unix';
      path = path.substring(1);
    }
    else {
      var os = 'win';
    }

    $('#modal_template').modal('hide');
    form_img.val(path);
    replace_img(file_type, url);

  });

  // Filter

  $(document).on('change keydown keyup input', '.media_list .filter', function(e){
    var filter = $(this).val().toLowerCase();
    $('.media_list .item').filter(function(index) {
      return $(this).text().toLowerCase().indexOf(filter) < 0;
    }).css('display', 'none');
    $('.media_list .item').filter(function(index) {
      return $(this).text().toLowerCase().indexOf(filter) >= 0;
    }).css('display', '');
    if(e.which == 13){
      $('.media_list .item:visible:first').click();
    }
  });

  // Click media list item
  $(document).on('click', '.media_list .item', function() {
    var li = this;
    $.get(WEBROOT + '/xhr/xbmcmm/' + $(this).data('type') + '/' + $(this).attr('id'), function(data) {
      if (!data.error) {
        $('.media_list .item').removeClass('active');
        $(li).addClass('active');
        $('.details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // Season tab
  $(document).on('click', '.season_tab', function() {
    $('.season_details').text('');
    $('.episode_details').text('');
    $.get(WEBROOT + '/xhr/xbmcmm/tvshow/' + $(this).data('tvshowid') + '/season/' + $(this).data('season'), function(data) {
      if (!data.error) {
        $('.season_details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // TVShow tab
  $(document).on('click', '.tvshow_tab', function() {
    $('.season_details').text('');
    $('.episode_details').text('');
    $.get(WEBROOT + '/xhr/xbmcmm/tvshow/' + $(this).data('id'), function(data) {
      if (!data.error) {
        $('.details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // Episode list
  $(document).on('click', '.episode_list li', function() {
    var li = $(this);
    $('.episode_list li').removeClass('active');
    $.get(WEBROOT + '/xhr/xbmcmm/episode/' + $(this).attr('id'), function(data) {
      if (!data.error) {
        li.addClass('active');
        $('.episode_details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // Album tab
  $(document).on('click', '.album_tab', function() {
    $('.album_details').text('');
    $.get(WEBROOT + '/xhr/xbmcmm/album/' + $(this).data('albumid'), function(data) {
      if (!data.error) {
        $('.album_details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // artist tab
  $(document).on('click', '.artist_tab', function() {
    $('.album_details').text('');
    $.get(WEBROOT + '/xhr/xbmcmm/artist/' + $(this).data('id'), function(data) {
      if (!data.error) {
        $('.details').replaceWith(data);
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // Audio DB Info
  $(document).on('click', '.tadb_info_btn', function() {
    var mbid = $('.details #media_id').data('mbid');
    var type = $('.details #media_id').attr('media-type');
    var query = $('.details #id_artist').val();

    if (!mbid) {
      var xhr_url = WEBROOT + '/xhr/tadb/' + type + '/query/' + query;
    }
    else {
      var xhr_url = WEBROOT + '/xhr/tadb/' + type + '/id/' + mbid;
    }

    $.get(xhr_url, function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  // Genres
  $(document).on('click', '.genre_save', function() {
    var genres = [];
    var genre_input =  $('.details #id_genre');

    $('.avail_genres :checked').each(function() {
      genres.push($(this).val());
    });

    genre_input.val(genres);
    genre_input.val(genre_input.val().replace(/,/g, ' / '));
    $('#modal_template').modal('hide');
  });

  $(document).on('click', '.add_genre_btn', function() {
    var exising = $('.details #id_genre').val();
    var file = $(this).data('file_type');
    var media =  $(this).data('media_type');

    $.post(WEBROOT + '/xhr/xbmcmm_genres/' + file + '/' + media + '/', {exist: exising}, function(data) {
      if (!data.error) {
        $('#modal_template').replaceWith(data);
        $('#modal_template').modal('show');
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

  // Export library
  $(document).on('click', '.library_export_btn', function() {
    $.get(WEBROOT + '/xhr/xbmcmm/export/' + $(this).data('library'), function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.export_file_list .path', function(){
    var path = $(this).data('path');
    $.post(WEBROOT + '/xhr/xbmcmm/export/filesystem/',{path: encodeURI(path)}, function(data){
      $('.export_file_list').replaceWith(data);
    });
  });

  $(document).on('click', '.export_save', function() {
    var library = $(this).data('library');
    var method = $(this).data('method');
    if (method == 'separate') {
      var form = $('.export_form').serialize();
    }
    else {
      var path = $('.export_file_list .current_path').text();
      if (path == 'Root') {
        return alert_popup('error', 'You must select a directory.');
      }
      var form = {path: encodeURI(path)}
    }

    $.post(WEBROOT + '/xhr/export/' + library + '/' + method + '/', form, function(data) {
      $('#modal_template').modal('hide');
      if (data.success) {
        alert_popup('success', 'Exporting '+library+' library.');
      }
      else {
        alert_popup('error', 'Failed to export '+library+' library.');
      }
    });
  });

  // Update library
  $(document).on('click', '.library_update_btn', function() {
    var library = $(this).data('library');
    $.get(WEBROOT + '/xhr/controls/update_' + library, function(data) {
      if (data.success) {
        alert_popup('success', 'Updating '+library+' library.');
      }
      else {
        alert_popup('error', 'Failed to update '+library+' library.');
      }
    });
  });

  // Clean library
  $(document).on('click', '.library_clean_btn', function() {
    var library = $(this).data('library');
    $.get(WEBROOT + '/xhr/controls/clean_' + library, function(data) {
      if (data.success) {
        alert_popup('success', 'Cleaning '+library+' library.');
      }
      else {
        alert_popup('error', 'Failed to clean '+library+' library.');
      }
    });
  });

  // Remove library item
  $(document).on('click', '.remove_item', function() {
    var id = $('.details #media_id').data('id');
    var media = $('.details #media_id').attr('media-type');

    $.get(WEBROOT + '/xhr/xbmcmm/remove/' + media + '/' + id, function(data) {
      $('#modal_template').replaceWith(data);
      $('#modal_template').modal('show');
    });
  });

  $(document).on('click', '.confirm_remove', function() {
    var id = $(this).data('id');
    var media = $(this).data('media');

    $.get(WEBROOT + '/xhr/library_remove/' + media + '/' + id, function(data) {
      if (data.success) {
        window.location.reload();
      }
      else {
        alert_popup('error', 'Failed to remove '+media);
      }
    });
  });

  // Validate numeric inputs
  $(document).on('change keydown keyup', 'form input', function(e){
    var input = $(this);
    var numbers = ['year', 'rating', 'season', 'episode']

    $.each(numbers, function() {
      if (input.attr('name') == this) {
        if ($.isNumeric(input.val()) == false) {
          input.closest('.control-group').addClass('error');
        }
        else if (input.length == 0) {
          input.closest('.control-group').addClass('error');
        }
        else if (input.closest('.control-group').hasClass('error')) {
          input.closest('.control-group').removeClass('error');
        }
      }
    });
  });

  // Apply changes
  $(document).on('click', '.xbmc_save', function() {
    var form = $(this).parents('form');
    var title = form.find('#id_title').val();
    var details = form.serialize();
    var id = $('.details #media_id').data('id');
    var type = $('.details #media_id').attr('media-type');

    $.post('/xhr/xbmcmm/' + type + '/set/' + id + '/', details, function(data) {
      if (!data.error) {
        alert_popup('success', data.status);
        if (type == 'episode') {
          $('.episode_list #'+id).click();
        }
        else if (type == 'album') {
          $('#tabs .album'+id).click();
        }
        else {
          $('.media_list #'+id).children('a').text(title);
          $('.media_list #'+id).click();
        }
      }
      else {
        alert_popup('error', data.error);
      }
    });
  });

});
