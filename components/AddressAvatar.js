import { useMemo } from "react";
import { minifyAddress } from "../helpers";

function AddressAvatar({ address }) {
  const shortAddress = useMemo(() => minifyAddress(address), [address]);

  return (
    <div className="active:scale-95 transition-all flex justify-center items-center border border-blueCustom rounded-md hover:opacity-80 disabled:opacity-80 bg-blueCustom text-white px-6 py-1 text-sm font-bold">
      <span>{shortAddress}</span>
    </div>
  );
}

export default AddressAvatar;
