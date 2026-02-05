import type { ReactNode } from "react";

/**
 * Basic JSON syntax highlighting using CSS class names.
 * Returns an array of React elements with spans for keys, strings, numbers, bools, and nulls.
 *
 * @param json - Pretty-printed JSON string
 * @param classNames - CSS module classes with jsonKey, jsonString, jsonNumber, jsonBool, jsonNull
 */
export function highlightJson(
  json: string,
  classNames: Record<string, string>
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(json.slice(lastIndex, match.index));
    }

    if (match[1]) {
      nodes.push(
        <span key={`k${match.index}`} className={classNames.jsonKey}>
          {match[1]}
        </span>
      );
      nodes.push(":");
    } else if (match[2]) {
      nodes.push(
        <span key={`s${match.index}`} className={classNames.jsonString}>
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      nodes.push(
        <span key={`b${match.index}`} className={classNames.jsonBool}>
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      nodes.push(
        <span key={`n${match.index}`} className={classNames.jsonNull}>
          {match[4]}
        </span>
      );
    } else if (match[5]) {
      nodes.push(
        <span key={`d${match.index}`} className={classNames.jsonNumber}>
          {match[5]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    nodes.push(json.slice(lastIndex));
  }

  return nodes;
}
