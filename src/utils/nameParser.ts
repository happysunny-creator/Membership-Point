/**
 * Utility to separate Korean names and positions/titles cleanly
 */

const KNOWN_POSITIONS = [
  '수석연구원',
  '책임연구원',
  '선임연구원',
  '전임연구원',
  '주임연구원',
  '수석매니저',
  '책임매니저',
  '선임매니저',
  '대표이사',
  '총괄대표',
  '공동대표',
  '수석부사장',
  '총괄사장',
  '부회장',
  '전무이사',
  '상무이사',
  '전문위원',
  '수석위원',
  '책임위원',
  '자문위원',
  '책임리더',
  '그룹리더',
  '파트리더',
  '팀리더',
  '셀리더',
  '본부장',
  '그룹장',
  '센터장',
  '지점장',
  '지사장',
  '처장',
  '국장',
  '원장',
  '실장',
  '단장',
  '파트장',
  '팀장',
  '부장',
  '차장',
  '과장',
  '대리',
  '주임',
  '사원',
  '인턴',
  '전무',
  '상무',
  '이사',
  '대표',
  '사장',
  '부사장',
  '회장',
  '수석',
  '책임',
  '선임',
  '전임',
  '매니저',
  '리더',
  '디렉터',
  '고문',
  '자문',
  '위원',
  '교수',
];

export function separateNameAndPosition(
  rawName: string | undefined | null,
  rawPosition?: string | undefined | null
): { name: string; position: string } {
  let name = (rawName || '').trim();
  let position = (rawPosition || '').trim();

  if (!name) {
    return { name: '', position: position };
  }

  // 1. Handle parenthesis pattern: e.g. "김민수(이사)", "김민수 (팀장)"
  const parenMatch = name.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const extractedName = parenMatch[1].trim();
    const extractedPos = parenMatch[2].trim();
    if (!position) {
      position = extractedPos;
    }
    name = extractedName;
  }

  // 2. If position is already explicitly given and name ends with that position, strip it
  if (position) {
    // Remove "님" if exists in comparison
    const cleanPos = position.replace(/님$/, '');
    if (name.endsWith(position)) {
      name = name.slice(0, -position.length).trim();
    } else if (name.endsWith(cleanPos)) {
      name = name.slice(0, -cleanPos.length).trim();
    }
  }

  // 3. If position is still not found or empty, search known titles
  if (!position) {
    // Check space separated: e.g. "김민수 이사", "정태양 수석매니저"
    const spaceParts = name.split(/\s+/);
    if (spaceParts.length >= 2) {
      const lastPart = spaceParts[spaceParts.length - 1].replace(/님$/, '');
      if (KNOWN_POSITIONS.includes(lastPart)) {
        position = lastPart;
        name = spaceParts.slice(0, -1).join(' ').trim();
        return { name, position };
      }
    }

    // Check attached suffixes: e.g. "김민수이사", "이지은수석연구원"
    for (const title of KNOWN_POSITIONS) {
      if (name.endsWith(title) && name.length > title.length) {
        const potentialName = name.slice(0, -title.length).trim();
        // Korean names are typically 2-4 characters
        if (potentialName.length >= 2) {
          name = potentialName;
          position = title;
          break;
        }
      }
    }
  }

  // Clean trailing "님" from position if user typed "부장님"
  if (position) {
    position = position.replace(/님$/, '').trim();
  }

  return { name, position };
}
