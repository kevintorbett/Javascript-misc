window.LoginView = Backbone.View.extend({

    initialize: function() {
        console.log('Initializing Login View');
        if (loggedin === 'yes') {
            window.location.replace('#users/page/');
        }
    },

    events: {
        "click #loginButton": "login"
    },

    render: function() {
        if (loggedin === 'yes') {
            window.location.replace('#users/page/');
        }
        $(this.el).html('<ul class="thumbnails"></ul>');
        $('.thumbnails', this.el).append(new LoginView.render().el);

        return this;
    }
});
window.LoginView = Backbone.View.extend({

    tagName: "li",
    className: "span3",
    initialize: function() {

    },

    render: function() {
        console.log(this.template)
        var l_refresh = localStorage.getItem('logged');

        if (l_refresh === '1') {
            window.location.replace('#users/page/"0"');
            return;
        }
        $(this.el).html(this.template(this.model));
        $('.add-menu').hide();
        return this;
    },
    events: {
        "click #loginButton": "login"
    },
    login: function(event) {

        event.preventDefault();
        $('.alert-error').hide(); // Hide any errors on a new submit
        console.log('Loggin in... ');
        var username = $('#inputEmail').val();
        var password = $('#inputPassword').val();
        var domain = 'DEV';
        var forceLogin = 'undefined';

        var text1 = '{"domain":"DEV","username":"' + username + '","password":"' + password + '","forceLogin":"undefined"}'
        $.ajax({
            url: 'http://localhost/MiddlewareService/api/system/users/authenticate',
            type: 'POST',
            beforeSend: function(p_req) {
                p_req.setRequestHeader('Authorization-Application', 1);
            },
            contentType: "application/json",
            dataType: "json",
            data: text1,
            success: function(data) {
                console.log(data)
                console.log(["Login request details: ", data]);

                if (data.error) { // If there is an error, show the error messages
                    $('.alert-error').text(data.error.text).show();
                } else { // If not, send them back to the home page
                    window.location.replace('#users/page/');
                }
            },
            error: function(msg) {
                $('.alert-error').text(msg).show();
            }

        });
        //   event.preventDefault(); // Don't let this button submit the form
        $('.add-menu').show();
        window.location.replace('#users/page/1');

    }

});