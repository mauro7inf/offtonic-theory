<?php
error_reporting(E_ALL);

$pages = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/theory/pages.json'), true);
$labels = array();
addLabels($pages);

function addLabels($page) {
	if (isset($page['label'])) {
		global $labels;
		array_push($labels, $page['label']);
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
	} else if (count($path) === 3) {
		return $number . ' ';
	}
}

function directionLabelsFromLabel($label) {
	global $labels;
	$directionLabels = array();
	$index = -1;
	for ($i = 0; $i < count($labels); $i++) {
		if ($labels[$i] === $label) {
			$index = $i;
			break;
		}
	}
	if ($index > 0) {
		$directionLabels['previous'] = $labels[$index - 1];
	}
	if ($index >= 0 && $index < count($labels) - 1) {
		$directionLabels['next'] = $labels[$index + 1];
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
		<link rel="icon" href="../favicon.ico" type="image/x-icon" />
		<link href="../theory.css" rel="stylesheet" type="text/css" />';
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

function createPageFooter($label) {
	$pageFooter = createDirectionLinks($label) . '<br />
		</div></div>
	</body>
</html>';
	echo $pageFooter;
}

?>