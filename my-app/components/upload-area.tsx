import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { UploadCloud } from "lucide-react";

export function UploadArea() {
  return (
    <Item
      variant="outline"
      className="rounded-[8px] border-dashed bg-slate-50/70"
    >
      <ItemMedia className="size-10 rounded-[8px] bg-sky-100 text-sky-700">
        <UploadCloud className="size-5" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Upload image references</ItemTitle>
        <ItemDescription className="text-xs">
          PNG, JPG, or WebP mock upload area
        </ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full sm:basis-auto">
        <Button variant="outline" size="sm">
          Browse
        </Button>
      </ItemActions>
    </Item>
  );
}
