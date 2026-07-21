import SparkleStar from "../ui/SparkleStar";

export default function Footer() {
  return (
    <div className="frosted-soft relative z-10 mt-16 rounded-none border-x-0 border-b-0 py-4">
      <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink/70">
        Made with <SparkleStar size={12} /> by Nam Le
      </p>
    </div>
  );
}
