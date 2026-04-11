import React from "react";
import { Outlet } from "react-router-dom";
import "../../styles/construction/construction.css"


const ConstructionLayout = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default ConstructionLayout;
