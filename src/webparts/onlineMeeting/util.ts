export const batchLimit = 20;

export const noUserIcon =
  "data:image/png;base64,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";

export const b64toBlob = (
  b64Data: string,
  contentType: string,
  sliceSize = 512,
): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const initials = (name: string): string => {
  const parts = name.split(" ");

  if (parts.length === 1) {
    if (parts[0].indexOf("_") !== -1) {
      const _parts = name.split("_");
      return _parts[0].substring(0, 1) + _parts[1].substring(0, 1);
    } else {
      return parts[0].substring(0, 1);
    }
  } else {
    return parts[0].substring(0, 1) + parts[1].substring(0, 1);
  }
};

export const backColor = (): string => {
  const colors: string[] = [
    "#f14646",
    "#468946",
    "#858383",
    "#dd33dd",
    "#797cd5",
    "#f74d05",
    "#309192",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return color;
};
