export function Vaults() {
  return (
    <div className="flex flex-col h-full w-full text-white box-border items-center max-w-[700px] m-auto">
      <div className="flex flex-col w-[90%] h-full border border-secondary rounded-md bg-[rgb(0,0,0,0.5)] gap-6 m-2 p-4">
        <div className="flex w-full h-fit p-2 justify-center">
          <h1 className="flex gap-2 items-center pb-2 sm:text-md lg:text-xl tracking-[.8rem] lg:tracking-[1.15rem] font-bold text-primary border-b border-secondary">
            Vaults
            <img
              className="rounded w-[25px] lg:w-[40px]"
              src={'/images/lock-icon.webp'}
            />
          </h1>
        </div>
      </div>
    </div>
  );
}
