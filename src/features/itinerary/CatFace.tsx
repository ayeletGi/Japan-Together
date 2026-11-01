/** The rally cat's face, drawn in a 34×34 box (the map places it with a transform). */
export function CatFace() {
  return (
    <>
      <path className="cat-face" d="M3 28 L4 6 L11 13 L23 13 L30 6 L31 28 Q17 34 3 28Z" />
      <path className="cat-ear" d="M7 12 L8 9 L10 12Z" />
      <path className="cat-ear" d="M27 12 L26 9 L24 12Z" />
      <circle className="cat-eye" cx="12" cy="20" r="1.8" />
      <circle className="cat-eye" cx="22" cy="20" r="1.8" />
      <path className="cat-cheek" d="M6 23h3M25 23h3" />
    </>
  );
}
