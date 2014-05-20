(function() {
	// Phonegap device object
	var device = window.device || { uuid: 'account-token' };

	function findPersistentToken(callback, idOnly) {
		if (callback) {
			UserApp.Token.search({ fields: ['token_id', 'name'], page_size: 100 }, function(error, tokens) {
				if (!error && tokens) {
					for (var i = 0; i < tokens.items.length; ++i) {
						if (tokens.items[i].name == (device.uuid || 'account-token')) {
							if (!idOnly) {
								UserApp.Token.get({ token_id: tokens.items[i].token_id }, function(error, token) {
									if (!error && token.length == 1) {
										callback(null, token[0]);
									} else {
										callback(error, null);
									}
								});
							} else {
								callback(null, tokens.items[i]);
							}

							return;
						}
					}
				}

				callback(error, null);
			});
		}
	}

	function createPersistentToken(callback) {
		UserApp.Token.save({
		    name: (device.uuid || 'account-token'),
		    enabled: true
		}, function(error, token){
		    if (!error) {
		    	callback && callback(null, token);
		    } else {
		    	callback && callback(error, null);
		    }
		});
	}
	
	UserApp.setupPersistentToken = function(callback) {
		findPersistentToken(function(error, token) {
			if (token) {
				callback && callback(null, token);
			} else if (!token) {
				createPersistentToken(function(error, newToken) {
					if (!error && newToken) {
						callback && callback(null, newToken);
					} else {
						callback && callback(error, null);
					}
				});
			} else {
				callback && callback(error, null);
			}
		});
	};

	UserApp.removePersistentToken = function(callback) {
		findPersistentToken(function(error, token) {
			if (!error && token) {
				UserApp.Token.remove({
				    token_id: token.token_id
				}, function(error, token){
				    if (!error) {
				    	callback && callback(null, true);
				    } else {
				    	callback && callback(error, false);
				    }
				});
			} else {
				callback && callback(error, false);
			}
		}, true);
	};

	UserApp.tokenStorage = {
		get: function() {
			return window.localStorage.getItem('ua_session_token');
		},
		set: function(token) {
			window.localStorage.setItem('ua_session_token', token);
		},
		remove: function() {
			window.localStorage.removeItem('ua_session_token');
		}
	};

	UserApp.oauthHandler = function(url, callback) {
		var ref = window.open(url, '_blank', 'location=yes');
        ref.addEventListener('loadstart', function(event) {
            var matches = null;
            if (event && (matches = event.url.match(/ua\_token=([a-z0-9\-\_]+)$/i)) != null) {
            	UserApp.setToken(matches[1]);
            	UserApp.setupPersistentToken(function(error, token) {
            		if (token) {
                    	callback(token.value);
                    } else {
                    	callback(matches[1]);
                    }
                });
                ref.close();
            }
        });
        ref.addEventListener('exit', function() {
        	callback(null);
        });
	};
})();