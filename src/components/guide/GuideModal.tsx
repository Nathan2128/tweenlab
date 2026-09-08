import { useEditor } from "../../store/editor";
import { Modal } from "../ui";
import { HowTo } from "../code/HowTo";

export function GuideModal() {
  const open = useEditor((s) => s.guideOpen);
  const setOpen = useEditor((s) => s.setGuideOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={<>Using your animation <em>in a real app</em></>} subtitle="Copy, paste, ship. Here is everything you need to know." width={1060}>
      <HowTo />
    </Modal>
  );
}
