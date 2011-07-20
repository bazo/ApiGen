$(function() {

	/**
	 * Updates menu.
	 *
	 * @param string page
	 */
	function updateMenu(page)
	{
		if (page === window.top.page) {
			return;
		}

		if (0 === page.search(/^class|function|constant/)) {
			window.top.frames['left'].$('#elements a[href^="' + page + '"]').click();
		} else if (0 === page.indexOf('source')) {
			window.top.frames['left'].$('#elements a[href^="' + page.substr(7) + '"]').click();
		} else if (0 === page.search(/^package|namespace/)) {
			window.top.frames['left'].$('#groups a[href^="' + page + '"]').click();
		} else if (0 === page.search(/^overview|tree|deprecated|todo/)) {
			window.top.frames['left'].$('#menu > a').click();
		}

		window.top.page = page;
	}

	var $frameset = $('frameset', window.top.document);

	// Menu size
	if (window.self === window.top) {
		window.page = 'overview.html';

		var splitterPosition = $.cookie('splitter');
		if (null !== splitterPosition) {
			$frameset.attr('cols', parseInt(splitterPosition) + ',*');
		}
	}

	// Menu
	if (window.self === window.top.frames['left']) {
		var $menu = $('#menu');
		var $groups = $('#groups', $menu);
		var $elements = $('#elements', $menu);

		var namespacesHidden = false;

		// Collapse deep packages and namespaces
		$('span', $groups).click(function() {
			$(this)
				.toggleClass('collapsed')
				.next('ul')
					.toggleClass('collapsed');
		});

		// Reset menu
		$('> a', $menu).click(function() {
			var $this = $(this);

			$(this).blur();

			// Css is a little quicker than show/hide/toggle
			$('li.active', $menu).removeClass('active');
			$('h3', $elements).css('display', 'block');
			$('ul', $elements).css('display', 'block');
			$('li', $elements).css('display', 'list-item');
			$('a span', $elements).css('display', 'inline');
			$('hr', $menu).css('display', 'block');

			namespacesHidden = false;

			// Collapse deep packages and namespaces
			$('span:not(.collapsed)', $groups).click();

			var $main = $('> ul > li.main', $groups);
			if ($main.length > 0) {
				// Open first level of the main project
				$('> span', $main).click();
			} else {
				// Open first level of all
				$('> ul > li > span', $groups).click();
			}

			window.top.page = $this.attr('href');
		}).click();
		// Mark active
		// Show only elements in package/namespace
		$('a', $groups).click(function() {
			var $this = $(this);

			// Collapse deep packages and namespaces
			$('span:not(.collapsed)', $groups).click();

			// Unmark active
			$('li.active', $menu).removeClass('active');

			// Mark active
			$this
				.blur()
				.parentsUntil('#groups', 'li')
					.addClass('active')
					.children('span')
						.click();

			// Shows only elements in package/namespace
			var elementsListsHidden = 0;
			var $elementsLists = $('ul', $elements);
			$elementsLists.each(function() {
				var $innerThis = $(this);

				// Css is a little quicker than show/hide/toggle

				var $all = $('li', $innerThis);
				$all.css('display', 'none');
				var $visible = $('a[rel="' + $this.attr('rel') + '"]', $all);
				$visible
					.parent()
						.css('display', 'list-item');

				if (0 !== $visible.length) {
					$innerThis
						.css('display', 'block')
						.prev()
							.css('display', 'block');
				} else {
					$innerThis
						.css('display', 'none')
						.prev()
							.css('display', 'none');

					elementsListsHidden++;
				}
			});
			$('hr', $menu).toggle($elementsLists.length !== elementsListsHidden);

			// Hide namespaces in elements names
			if (!namespacesHidden) {
				$('span', $elements).css('display', 'none');
				namespacesHidden = true;
			}

			window.top.page = $this.attr('href');
		});
		$('a', $elements).click(function() {
			var $this = $(this);

			// Mark active package/namespace
			$('a[rel="' + $this.attr('rel') + '"]', $groups).click();

			// Mark active
			$this
				.blur()
				.parent()
					.addClass('active');

			window.top.page = $this.attr('href');
		});
	}

	// Content
	if (window.self === window.top.frames['right']) {
		// Move back/next in browser history
		$(function() {
			window.top.document.title = window.document.title;
			updateMenu(window.location.pathname.split('/').pop());
		});

		var $content = $('#content');

		// Update menu
		$('a').click(function() {
			updateMenu($(this).attr('href'));
		});

		// Search autocompletion
		var autocompleteFound = false;
		var $search = $('#search input[name=q]');
		$search
			.autocomplete(window.top.elements, {
				matchContains: true,
				scrollHeight: 200,
				max: 20,
				formatItem: function(data) {
					return data[1].replace(/^(.+\\)(.+)$/, '<small>$1</small>$2');
				},
				formatMatch: function(data) {
					return data[1];
				},
				formatResult: function(data) {
					return data[1];
				}
			}).result(function(event, data) {
				autocompleteFound = true;
				var page = data[0] + '-' + data[1].replace(/[^\w]/g, '.') + '.html';
				updateMenu(page);
				var location = window.location.href.split('/');
				location.pop();
				location.push(page);
				window.location = location.join('/');
			}).closest('form')
				.submit(function() {
					var query = $search.val();
					if ('' === query) {
						return false;
					}

					var label = $('#search input[name=more]').val();
					if (!autocompleteFound && label && -1 === query.indexOf('more:')) {
						$search.val(query + ' more:' + label);
					}

					return !autocompleteFound && '' !== $('#search input[name=cx]').val();
				});

		// Save original order
		$('table.summary tr[data-order]', $content).each(function(index) {
			do {
				index = '0' + index;
			} while (index.length < 3);
			$(this).attr('data-orig-order', index);
		});

		// Switch between natural and alphabetical order
		var $caption = $('table.summary', $content)
			.filter(':has(tr[data-order])')
				.find('caption');
		$caption
			.click(function() {
				var $this = $(this);
				var sorted = !$this.data('sorted');
				$this.data('sorted', sorted);
				$.cookie('sorted', sorted, {expires: 365});
				var attr = sorted ? 'data-order' : 'data-orig-order';
				$this
					.closest("table")
						.find('tr').sortElements(function(a, b) {
							return $(a).attr(attr) > $(b).attr(attr) ? 1 : -1;
						});
				return false;
			}).addClass('switchable')
			.attr('title', 'Switch between natural and alphabetical order');
		if ('true' === $.cookie('sorted')) {
			$caption.click();
		}

		// Delayed hover efect on summary
		var timeout;
		$('tr', $content).filter(':has(.detailed)')
			.hover(function() {
				clearTimeout(timeout);
				var $this = $(this);
				timeout = setTimeout(function() {
					$('.short', $this).hide();
					$('.detailed', $this).show();
				}, 500);
			}, function() {
				clearTimeout(timeout);
			}).click(function() { // Immediate hover effect on summary
				clearTimeout(timeout);
				var $this = $(this);
				$('.short', $this).hide();
				$('.detailed', $this).show();
			});


		// Splitter
		var $documentLeft = $(window.top.frames['left'].document);
		var $documentRight = $(window.top.frames['right'].document);
		var $documents = $()
			.add($documentLeft)
			.add($documentRight);
		var $splitter = $('#splitter');
		var splitterWidth = $splitter.width();

		$splitter.mousedown(function() {
				$splitter.addClass('active');

				$documentLeft.mousemove(function(event) {
					if (event.pageX >= 230) {
						$frameset.attr('cols', event.pageX + ',*');
					}
				});
				$documentRight.mousemove(function(event) {
					if ($documentRight.width() >= 600 + splitterWidth) {
						$frameset.attr('cols', parseInt($frameset.attr('cols')) + event.pageX + ',*');
					}
				});

				$()
					.add($splitter)
					.add($documents)
						.mouseup(function() {
							$splitter
								.removeClass('active')
								.unbind('mouseup');
							$documents
								.unbind('mousemove')
								.unbind('mouseup');

							$.cookie('splitter', parseInt($frameset.attr('cols')), {expires: 365});
						});

				return false;
			});
	}
});
