/**
 * @file jquery.tr.js
 * @brief Support for internationalization.
 * @author Jonathan Giroux (Bloutiouf)
 * @author Salvador de la Puente (lodr)
 * @site https://github.com/lodr/jquery.tr
 * @version 1.2
 * @license MIT license <http://www.opensource.org/licenses/MIT>
 * 
 * jquery.tr is a jQuery plugin which enables you to translate text on the
 * client side.
 * 
 * Features:
 * - uses a predefined dictionary.
 * - translates into languages with several plurals.
 * - replaces parameters in translations.
 * - uses cookie information if jQuery.cookie is available.
 * - designed to be used by CouchApps.
 * - debug mode and prefix to indicate missed keys
 * - generic constructor to select words' variations
 * - number / genre specific constructors to autoselect proper words' variations
 */

(function($) {

	// configuration, feel free to edit the following lines

	/**
	 * Language at the start of the application.
	 * If you use the jQuery's Cookie plugin, then the language will be stored
	 * in a cookie.
	 */
	var language = 'en';

	/**
	 * Name of cookie storing language. Change it if it conflicts.
	 * If you don't use the jQuery's Cookie plugin, it doesn't matter.
	 */
	var cookieName = 'language';

	/**
	 * Debug prefix to preppend to the translations with missed keys in case of
	 * debug mode.
	 */
	var debugMode = false;

	/**
	 * Debug prefix to preppend to the translations with missed keys in case of
	 * debug mode.
	 */
	var debugPrefix = '[!!] ';

	// end of configuration

	/**
	 * Intern dictionary.
	 */
	var dictionary;

	/**
	 * Standard replace function.
	 */
	var replace = function(str, opt) {
		var args = (typeof opt === 'object' && opt != null) ? opt : arguments;
		return str.replace(/&(\w+)/g, function(match, n) {
			var value = args[n];
			if (value === undefined) {
				return match;
			}
			return value;
		});
	};

	/**
	 * Default translator in case of error or unavailability...
	 */
	var lambda = function(key, opt) {
		var args = (typeof opt === 'object' && opt != null) ? opt : arguments;
		return replace(key, args);
	};

	// load language from cookie
	if ($.cookie) {
		language = $.cookie(cookieName) || language;
	}

	$.tr = {

		/**
		 * @name $.tr.dictionary
		 * @brief Get the current dictionary.
		 * @returns object dictionary.
		 * 
		 * Example: Gets the current dictionary.
		 * @code
		 * var dict = $.tr.dictionary();
		 * @endcode
		 */
		/**
		 * @name $.tr.dictionary
		 * @brief Set the current dictionary.
		 * @param object newDictionary new dictionary.
		 * 
		 * Example: Sets the current dictionary.
		 * @code
		 * $.tr.dictionary(dict);
		 * @endcode
		 */
		dictionary : function(newDictionary) {
			if (newDictionary !== undefined) {
				dictionary = newDictionary;
			}
			return dictionary;
		},

		/**
		 * @name $.tr.debug
		 * @brief Check if debug mode is enabled.
		 * @returns boolean.
		 */
		/**
		 * @name $.tr.debug
		 * @brief Enable or disables debug mode.
		 * @param boolean debugMode status for debug mode.
		 * 
		 * Example: Enable debug mode.
		 * @code
		 * $.tr.debug(true);
		 * @endcode
		 */
		debug : function(mode) {
			if (mode !== undefined) {
				debugMode = mode;
			}
			return debugMode;
		},

		/**
		 * @name $.tr.debugPrefix
		 * @brief Returns the debug prefix.
		 * @returns boolean.
		 */
		/**
		 * @name $.tr.debugPrefix
		 * @brief Sets the debug prefix. Debug prefix is a string to be preppend
		 * to those translations with a missed key to alert the developers they
		 * are missing a translation. It only works when debug mode is enabled.
		 * @param string prefix the prefix. The default value is "[!!] "
		 * 
		 * Example: Set debug prefix
		 * @code
		 * $.tr.debug("missed key: ");
		 * @endcode
		 */
		debugPrefix : function(prefix) {
			if (prefix !== undefined) {
				debugPrefix = prefix;
			}
			return debugPrefix;
		},


		/**
		 * @name $.tr.language
		 * @brief Get the current language.
		 * @returns string language.
		 * 
		 * Example: Gets the current language.
		 * @code
		 * var lg = $.tr.language();
		 * @endcode
		 */
		/**
		 * @name $.tr.language
		 * @brief Set the current language.
		 * @param string newLanguage new language.
		 * @param bool useCookie optional if true and cookie plugin is
		 * available, do nothing (allows to use a default language)
		 * @returns string language.
		 * 
		 * Example: Sets the current language.
		 * @code
		 * $.tr.language('fr');
		 * @endcode
		 */
		language : function(newLanguage, useCookie) {
			if (newLanguage !== undefined) {
				if (useCookie && $.cookie) {
					var cookieLanguage = $.cookie(cookieName);
					if (cookieLanguage) {
						return cookieLanguage;	
					}
				}
				language = newLanguage;
				if ($.cookie) {
					$.cookie(cookieName, language);
				}
			}
			return language;
		},

		/**
		 * @name $.tr.s
		 * @brief Introduce a multiple-choice translation
		 * @param string ... an arbitrary number of strings with possible options
		 * @returns function a function that lets select the proper translation by key _i.
		 * 
		 * Example: Select one of the translations.
		 * @code
		 * {
		 *  ...
		 *  'USA' : $.tr.s('USA', 'United States of America'),
		 *  'Salutation &name' : $.tr.s('Dear &name', 'Hi &name', 'Good morning &name')
		 *  ...
		 * }
		 *
		 * // Supose _ is the translator function
		 * _('USA', {_i:0}) // returns 'USA'
		 * _('USA', {_i:1}) // returns 'United States of America'
		 *
		 * _('Salutation &name', {name:'John', _i:0}) // returns 'Dear John'
		 * _('Salutation &name', {name:'John', _i:1}) // returns 'Hi John'
		 * _('Salutation &name', {name:'John', _i:2}) // returns 'Good morning John'
		 * @endcode
		 */
		s : function() {
			var a = $.makeArray(arguments); 
			return function(opt, replace) {
				return replace(a[opt._i], opt);
			}
		},

		/**
		 * @name $.tr.g
		 * @brief Introduce a gender driven translation
		 * @param string m masculine option of the translation
		 * @param string g feminine option of the translation
		 * @returns function a function that lets select the proper translation by the gender key _g
		 * The gender key can be 'm' (default) for masculine or 'f' for feminine.
		 * 
		 * Named parameters are allowed inside options.
		 *
		 * Example: Select one of the translations by gender.
		 * @code
		 * {
		 *  ...
		 *  'Actor' : $.tr.s('Actor', 'Actress'),
		 *  '&name is an actor' : $.tr.g('&name is an actor', '&name is an actress'),
		 *  ...
		 * }
		 *
		 * // Supose _ is the translator function
		 * _('Actor', {_g:'m'}) // returns 'Actor'
		 * _('Actor', {_g:'f'}) // returns 'Actress'
		 * _('&name is an actor', {name:'John', _g:'m'}) // returns 'John is an actor'
		 * _('&name is an actor', {name:'Jane', _g:'f'}) // returns 'Jane is an actress'
		 * @endcode
		 */
		g : function(m, f) {
			var a = [m, f]; 
			return function(opt, replace) {
				var i = 0;
				if (opt._g && opt._g !== 'm') {
					i = 1;
				}
				return replace(a[i], opt);
			}
		},

		/**
		 * @name $.tr.p
		 * @brief Introduce a plural driven translation
		 * @param string s singular option of the translation
		 * @param string p plural option of the translation
		 * @param string z option of the translation when zero (optional)
		 * @returns function a function that lets select the proper translation by the count key _p
		 * The singular option is only returned when _p == 1. Else, the plural option is returned.
		 * Only if you provide the z option, this is returned when _p == 0.
		 * 
		 * Named parameters are allowed inside options.
		 *
		 * Example: Select one of the translations by object counting.
		 * @code
		 * {
		 *  ...
		 *  'You have &_p mails' : $.tr.p('You have &email', 'You have &emails'),
		 *  '&_p notifications' : $.tr.p('&_p notification', '&_p notifications', 'No notifications'),
		 *  ...
		 * }
		 *
		 * // Supose _ is the translator function
		 * _('You have &_p mails', {_p:0}) // returns 'You have 0 mails'
		 * _('You have &_p mails', {_p:2}) // returns 'You have 2 mails'
		 * _('You have &_p mails', {_p:1}) // returns 'You have 1 mail'
		 * _('&_p notifications', {_p:0}) // returns 'No notifications'
		 * _('&_p notifications', {_p:2}) // returns '2 notifications'
		 * _('&_p notifications', {_p:1}) // returns '1 notification'
		 * @endcode
		 */
		p : function(s, p, z) {
			var a = [s, p, z]; 
			return function(opt, replace) {
				var i = 1;
				if (z && typeof opt._p != 'undefined' && opt._p == 0) {
					i = 2;
				} else if (opt._p && opt._p == 1) {
					i = 0;
				}
				return replace(a[i], opt);
			}
		},

		/**
		 * @name $.tr.gp
		 * @brief Introduce a plural / gender driven translation
		 * @param string ms masculine-singular option of the translation
		 * @param string fs feminine-singular option of the translation
		 * @param string mp masculine-plural option of the translation
		 * @param string fp feminine-plural option of the translation
		 * @param string mz masculine-zero option of the translation (optional)
		 * @param string fz feminine-zero option of the translation (optional)
		 * @returns function a function that lets select the proper translation by the count key _p
		 * and gender key _g. The gender key can be 'm' (default) for masculine or 'f' for feminine.
		 *
		 * Singular options are only returned when _p == 1. Else, the proper plural option is selected.
		 * Only if you provide the last optional parameters and if _p == 0, zero options are selected.
		 * 
		 * Named parameters are allowed inside options.
		 *
		 * Example 1: Select one of the translations by object counting and gender (no zero option).
		 * @code
		 * {
		 *  ...
		 *  '&name is an actor' : $.tr.gp('&name is an actor', '&name is an actress', &name are actors, &name are actresses),
		 *  ...
		 * }
		 *
		 * // Supose _ is the translator function
		 * _('&name is an actor', {name:'John and Jimmy', _p:0, _g:'m'}) // returns 'John and Jimmy are actors'
		 * _('&name is an actor', {name:'John and Jimmy', _p:2, _g:'m'}) // returns 'John and Jimmy are actors'
		 * _('&name is an actor', {name:'John', _p:1, _g:'m'}) // returns 'John is an actor'
		 *
		 * _('&name is an actor', {name:'Jane and Lisa', _p:0, _g:'f'}) // returns 'Jane and Lisa are actresses'
		 * _('&name is an actor', {name:'Jane and Lisa', _p:2, _g:'f'}) // returns 'Jane and Lisa are actresses'
		 * _('&name is an actor', {name:'Jane', _p:1, _g:'f'}) // returns 'Jane is an actress'
		 * @endcode
		 *
		 * Example 2: Select one of the translations by object counting and gender (with zero option).
		 * @code
		 * {
		 *  ...
		 *  '&name is an actor' : $.tr.gp('&name is an actor', '&name is an actress', '&name are actors', '&name are actresses', 'no actors', 'no actresses'),
		 *  ...
		 * }
		 *
		 * // Supose _ is the translator function
		 * _('&name is an actor', {_p:0, _g:'m'}) // returns 'no actors'
		 * _('&name is an actor', {name:'John and Jimmy', _p:2, _g:'m'}) // returns 'John and Jimmy are actors'
		 * _('&name is an actor', {name:'John', _p:1, _g:'m'}) // returns 'John is an actor'
		 *
		 * _('&name is an actor', {_p:0, _g:'f'}) // returns 'no actresses'
		 * _('&name is an actor', {name:'Jane and Lisa', _p:2, _g:'f'}) // returns 'Jane and Lisa are actresses'
		 * _('&name is an actor', {name:'Jane', _p:1, _g:'f'}) // returns 'Jane is an actress'
		 * @endcode

		 */
		gp : function(ms, fs, mp, fp, mz, fz) {
			var a = [ms, fs, mp, fp, mz, fz];
			return function(opt, replace) {
				var i = 2;
				if (mz && typeof opt._p != 'undefined' && opt._p == 0) {
					i = 4;
				} else if (opt._p && opt._p == 1) {
					i = 0;
				}
				if (opt._g && opt._g !== 'm') {
					if (i<4 || fz) {
						i += 1;
					}
				}
				return replace(a[i], opt);
			}
		},

		/**
		 * @name $.tr.translator
		 * @brief Get a translator function.
		 * @param object customDictionary optional associative array replacing the
		 * library dictionary.
		 * @param mixed ... list of keys to traverse the dictionary.
		 * @returns function
		 */
		translator : function(customDictionary) {
			
			// varargs
			var args = $.makeArray(arguments);
			
			// which dictionary to use
			var dict = dictionary;
			if (typeof customDictionary == 'object') {
				args.shift();
				dict = customDictionary;
			}

			// if the chosen dictionary is not available...
			if (!dict) {
				return lambda;
			}
			
			// parse through the hierarchy
			var langSet = dict;
			for (var i in args) {
				langSet = langSet[args[i]];
				if (!langSet) {
					return lambda;
				}
			}

			// dictionary for the chosen language
			var lang = langSet[language];

			// if lang is an associative map encoded as a string, parse the map
			if (typeof lang == 'function') {
				lang = lang();
			}

			// if the chosen language is not available...
			if (!lang) {
				return lambda;
			}

			// time to get the real translator
			return function(key, opt) {
				var value = lang[key];
				var args = (typeof opt === 'object' && opt != null) ? opt : arguments;
				if (typeof value === 'string') {
					return replace(value, args);
				} else if (typeof value === 'function') {
					return value(args, replace);
				} else if (typeof value === 'number') {
					return value;
				} else {
					return (debugMode ? debugPrefix : '')+replace(key, args);
				}
			};
		}

	};

})(jQuery);
