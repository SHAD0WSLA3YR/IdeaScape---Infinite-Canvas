import { imgLineiconsComment1Text, imgEllipse4 } from "./svg-phjcw";

function LineiconsComment1Text() {
  return (
    <div className="absolute left-[21px] size-3 top-[182px]" data-name="lineicons:comment-1-text">
      <img className="block max-w-none size-full" src={imgLineiconsComment1Text} />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-1.5 top-1.5">
      <div className="absolute bg-gray-300 h-[232px] left-1.5 rounded-[10px] top-1.5 w-[302px]">
        <div aria-hidden="true" className="absolute border-2 border-gray-300 border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_0px_25px_0px_rgba(170,170,170,0.25)]" />
      </div>
      <div className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[21px] not-italic text-[12px] text-black top-[198px] w-[236px]">
        <p className="leading-[normal]">THIS IS A TEST OF COMMENT SECTION ON EACH NODE.</p>
      </div>
      <div className="absolute bg-[#fefeff] h-[170px] left-2 rounded-[10px] top-2 w-[298px]" />
      <div className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[21px] not-italic text-[12px] text-black text-nowrap top-6">
        <p className="leading-[normal] whitespace-pre">Double-click to edit</p>
      </div>
      <div className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[34px] not-italic text-[8px] text-black text-nowrap top-[183px]">
        <p className="leading-[normal] whitespace-pre">Comment:</p>
      </div>
      <LineiconsComment1Text />
    </div>
  );
}

export default function Group6() {
  return (
    <div className="relative size-full">
      <Group5 />
      <div className="absolute left-[151px] size-3 top-0">
        <img className="block max-w-none size-full" src={imgEllipse4} />
      </div>
      <div className="absolute left-[300px] size-3 top-[116px]">
        <img className="block max-w-none size-full" src={imgEllipse4} />
      </div>
      <div className="absolute left-[151px] size-3 top-[232px]">
        <img className="block max-w-none size-full" src={imgEllipse4} />
      </div>
      <div className="absolute left-0 size-3 top-[110px]">
        <img className="block max-w-none size-full" src={imgEllipse4} />
      </div>
    </div>
  );
}