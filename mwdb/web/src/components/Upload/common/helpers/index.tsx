export const sharingModeToUploadParam = (shareWith: string, group: string) => {
    if (shareWith === "default") return "*";
    else if (shareWith === "public") return "public";
    else if (shareWith === "private") return "private";
    else if (shareWith === "single") return group;
};

export const getSharingModeHint = (shareWith: string, type: string) => {
    const hintType = type === "blob" ? "blob" : "sample";
    if (shareWith === "default")
        return `The ${hintType} and all related artifacts will be shared with all your workgroups`;
    else if (shareWith === "public")
        return `The ${hintType} will be added to the public feed, so everyone will see it.`;
    else if (shareWith === "private")
        return `The ${hintType} will be accessible only from your account.`;
    else if (shareWith === "single")
        return `The ${hintType} will be accessible only for you and chosen group.`;
};
