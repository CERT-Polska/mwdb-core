import { Tag as TagType } from "@mwdb-web/types/types";
import { TagProps } from "@mwdb-web/types/props";
import { Tag } from ".";

type Props = TagProps & {
    tags: TagType[];
};

export function TagList({ tags, ...props }: Props) {
    return (
        <>
            {tags
                .sort((a: TagType, b: TagType) => a.tag.localeCompare(b.tag))
                .map((tag: TagType) => (
                    <Tag {...props} tag={tag.tag} key={tag.tag} />
                ))}
        </>
    );
}
