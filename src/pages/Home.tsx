import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex flex-col h-full w-full text-white box-border items-center max-w-[700px] m-auto">
      <div className="flex flex-col w-[90%] h-full border border-secondary rounded-md bg-[rgb(0,0,0,0.5)] gap-6 m-2 p-4">
        <div className="flex w-full h-fit p-2 justify-center">
          <h1 className="flex gap-2 pb-2 items-center sm:text-md lg:text-xl tracking-[.8rem] lg:tracking-[1.15rem] font-bold text-primary border-b border-secondary">
            Secretorium
            <img
              alt="collaborator icon"
              className="rounded w-[25px] lg:w-[40px]"
              src={'/images/collaborator-icon.webp'}
            />
          </h1>
        </div>
        <div className="flex flex-col gap-4 text-xs lg:text-md">
          <p className="text-center">
            Secretorium is a decentralized secret manager that allows users to
            store secrets on the AO supercomputer.
          </p>
          <p className="text-center">
            The secrets are split into Shamir shares, with a public share
            selected, and subsequent shares encrypted with collaborator public
            keys.
          </p>
          <p className="text-center">
            These shares are then stored in a Vault process, and used by
            Secretorium integrations to drive collaboration on permaweb
            applications, allowing for secure sharing and collaboration with a
            BYOK (Bring Your Own Keys) model.
          </p>
        </div>

        <div className="flex size-full justify-center items-end pb-10">
          <Link to={`/vaults?action=create`} className="action-button">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
