<?php
error_reporting(E_ALL);

$pages = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/theory/pages.json'), true);
$pageLabels = array();
addLabels($pages);

function addLabels($page) {
	if (isset($page['label']) && isset($page['url']) && substr($page['url'], 0, 1) !== '#') {
		global $pageLabels;
		array_push($pageLabels, $page['label']);
	}
	if (isset($page['subsections'])) {
		for ($i = 0; $i < count($page['subsections']); $i++) {
			addLabels($page['subsections'][$i]);
		}
	}
}

function getPagePath($label) {
	return getPagePathHelper($label, NULL);
}

// recursive function using $path as accumulator
function getPagePathHelper($label, $path) {
	global $pages;
	if ($path === NULL) {
		if ($label === $pages['label']) {
			return array();
		} else {
			return getPagePathHelper($label, array());
		}
	}
	$parent = pageAtPath($path);
	$chapters = $parent['subsections'];
	for ($i = 0; $i < count($chapters); $i++) {
		$newPath = $path;
		array_push($newPath, $i);
		if (isset($chapters[$i]['label']) && $label === $chapters[$i]['label']) {
			return $newPath;
		} else {
			if (isset($chapters[$i]['subsections'])) {
				$returnedPath = getPagePathHelper($label, $newPath);
				if ($returnedPath !== NULL) {
					return $returnedPath;
				}
			}
		}
	}
	return NULL;
}

function pageAtPath($path) {
	global $pages;
	$page = $pages;
	for ($i = 0; $i < count($path); $i++) {
		$page = $page['subsections'][$path[$i]];
	}
	return $page;
}

function numberAtPath($path) {
	$number = '';
	$page = pageAtPath($path);
	if (!isset($page['number'])) {
		return $number;
	}
	// we can start at 0 for consistency but the page at path [] has no number
	for ($i = 0; $i <= count($path); $i++) {
		$page = pageAtPath(array_slice($path, 0, $i));
		if (isset($page['number'])) {
			if ($number !== '') {
				$number .= '.';
			}
			$number .= $page['number'];
		}
	}
	return $number;
}

function keywordsAtPath($path) {
	$keywords = array();
	for ($i = 0; $i <= count($path); $i++) {
		$page = pageAtPath(array_slice($path, 0, $i));
		if (isset($page['keywords'])) {
			array_push($keywords, $page['keywords']);
		}
	}
	return implode($keywords, ', ');
}

function breadcrumbsToPath($path) {
	$crumbs = array();
	// don't include current page
	for ($i = 0; $i < count($path); $i++) {
		$slicedPath = array_slice($path, 0, $i);
		$page = pageAtPath($slicedPath);
		$bread = $page['title'];
		if (isset($page['bread'])) {
			$bread = $page['bread'];
		}
		$crumb = '';
		if (isset($page['url'])) {
			$crumb = '<a href="' . normalizeUrl($page['url']) . '">' . prePageTitleAtPath($slicedPath) . $bread . '</a>';
		} else {
			$crumb = $bread;
		}
		array_push($crumbs, $crumb);
	}
	for ($i = 0; $i < count($crumbs); $i++) {
		$spaces = '';
		for ($j = 0; $j < $i; $j++) {
			$spaces .= '&emsp;&emsp;&emsp;';
		}
		$crumbs[$i] = $spaces . $crumbs[$i];
	}
	return implode($crumbs, '<br />');
	return implode($crumbs, ' — ');
}

function normalizeUrl($url) {
	return 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] ? 's' : '') . '://' . $_SERVER['HTTP_HOST'] . '/' . 'theory/' . $url;
}

function pageUrlAtPath($path) {
	$page = pageAtPath($path);
	if (!isset($page['url']) || substr($page['url'], 0, 1) === '#') {
		$parentPath = array_slice($path, 0, count($path) - 1);
		return pageUrlAtPath($parentPath);
	} else {
		return normalizeUrl($page['url']);
	}
}

function urlAtPath($path) {
	$page = pageAtPath($path);
	if (!isset($page['url'])) {
		$parentPath = array_slice($path, 0, count($path) - 1);
		return urlAtPath($parentPath);
	} else {
		$url = $page['url'];
		if (substr($url, 0, 1) !== '#') {
			return normalizeUrl($url);
		} else {
			$parentPath = array_slice($path, 0, count($path) - 1);
			return pageUrlAtPath($parentPath) . $url;
		}
	}
}

function preHeadTitleAtPath($path) {
	$number = numberAtPath($path);

	if ($number === '') {
		return '';
	}

	if (count($path) === 2) {
		return 'Chapter ' . $number . ': ';
	} else if (count($path) === 3) {
		return 'Section ' . $number . ': ';
	}
}

function prePageTitleAtPath($path) {
	$number = numberAtPath($path);

	if ($number === '') {
		return '';
	}

	if (count($path) === 2) {
		return 'Chapter ' . $number . ': ';
	} else if (count($path) === 3 || count($path) === 4) {
		return $number . ' ';
	}
}

function directionLabelsFromLabel($label) {
	global $pageLabels;
	$directionLabels = array();
	$index = -1;
	for ($i = 0; $i < count($pageLabels); $i++) {
		if ($pageLabels[$i] === $label) {
			$index = $i;
			break;
		}
	}
	if ($index > 0) {
		$directionLabels['previous'] = $pageLabels[$index - 1];
	}
	if ($index >= 0 && $index < count($pageLabels) - 1) {
		$directionLabels['next'] = $pageLabels[$index + 1];
	}
	return $directionLabels;
}

function directionLinkAtPath($path) {
	$page = pageAtPath($path);
	$url = normalizeUrl($page['url']);
	$title = prePageTitleAtPath($path) . $page['title'];
	if (isset($page['directionTitle'])) {
		$title = $page['directionTitle'];
	}
	return '<a href="' . $url . '">' . $title . '</a>';
}

function createDirectionLinks($label) {
	$directionLabels = directionLabelsFromLabel($label);
	$directionArray = array();
	if (isset($directionLabels['previous'])) {
		$previousPath = getPagePath($directionLabels['previous']);
		$previous = '<div class="previous">&lArr; ' . directionLinkAtPath($previousPath) . '</div>';
		array_push($directionArray, $previous);
	}
	if (isset($directionLabels['next'])) {
		$nextPath = getPagePath($directionLabels['next']);
		$next = '<div class="next">' . directionLinkAtPath($nextPath) . ' &rArr;</div>';
		array_push($directionArray, $next);
	}
	$directionText = '<div class="directions">' . implode($directionArray) . '</div>';
	return $directionText;
}

function createPageHeader($label) {
	$path = getPagePath($label);
	$page = pageAtPath($path);
	$pageTitle = '';

	$number = numberAtPath($path);

	if (count($path) === 2) {
		$pageTitle = '<h1 class="chapter-title">' . prePageTitleAtPath($path) . $page['title'] . '</h1>';
	} else if (count($path) === 3) {
		$pageTitle = '<h2 class="section-title">' . prePageTitleAtPath($path) . $page['title'] . '</h2>';
	}

	$pageHeader = '<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="description" content="Offtonic Theory by Mauro Braunstein" />
		<meta name="keywords" content="' . keywordsAtPath($path) . '" />
		<title>' . preHeadTitleAtPath($path) . $page['title'] . ' - Offtonic Theory</title>
		<link rel="icon" href="' . normalizeUrl('favicon.ico') . '" type="image/x-icon" />
		<link href="' . normalizeUrl('theory.css') . '" rel="stylesheet" type="text/css" />';
	if (isset($page['js'])) {
		for ($i = 0; $i < count($page['js']); $i++) {
			$pageHeader .= '<script src="' . normalizeUrl('lib/' . $page['js'][$i]) . '"></script>';
		}
	}
	$pageHeader .= '
	</head>
	<body>
		<div class="outer-container"><div class="inner-container">
			<h3 class="book-name">' . breadcrumbsToPath($path) . '</h3>
			' . createDirectionLinks($label) . '<br />
			' . $pageTitle;
	echo $pageHeader;
}

function createTableOfContents($label) {
	$path = getPagePath($label);
	echo tableOfContentsAtPath($path);
}

function tableOfContentsAtPath($path) {
	$page = pageAtPath($path);
	$table = '';
	$end = '';
	if (count($path) === 0) {
		// no special start or end for top-level table of contents
	} else if (count($path) === 1) { // chapters in part
		$table = '<h3 class="subsection-title">' . $page['title'] . '</h3>' . "\n";
		if (isset($page['subsections'])) {
			$table .= '<ul class="table-of-contents">' . "\n";
			$end = '</ul>' . "\n";
		}
	} else if (count($path) === 2) { // sections in chapter
		$table = '<li><a href="' . urlAtPath($path) . '">' . prePageTitleAtPath($path) . $page['title'] . '</a>';
		if (isset($page['subsections'])) {
			$table .= "\n" . '<ul class="table-of-contents-sublist">' . "\n";
			$end = '</ul>' . "\n";
		}
		$end .= '</li>' . "\n";
	} else if (count($path) === 3) { // subsections in section
		$table = '<li><a href="' . urlAtPath($path) . '">' . prePageTitleAtPath($path) . $page['title'] . '</a>';
		if (isset($page['subsections'])) {
			$table .= "\n" . '<ul class="table-of-contents-subsublist">' . "\n";
			$end = '</ul>' . "\n";
		}
		$end .= '</li>' . "\n";
	} else if (count($path) === 4) { // subsections; no contents
		$table = '<li><a href="' . urlAtPath($path) . '">' . prePageTitleAtPath($path) . $page['title'] . '</a></li>' . "\n";
	}
	if (isset($page['subsections'])) {
		for ($i = 0; $i < count($page['subsections']); $i++) {
			$childPath = $path;
			array_push($childPath, $i);
			$table .= tableOfContentsAtPath($childPath);
		}
	}
	return $table . $end;
}

function createPageFooter($label) {
	$pageFooter = createDirectionLinks($label) . '<br />
		</div></div>
	</body>
</html>';
	echo $pageFooter;
}

?>