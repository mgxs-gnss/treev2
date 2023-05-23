interface Trait {
  trait_type: string;
  value: string | number;
}

export interface JSONData {
  attributes: Trait[];
  creator: string;
  description: string;
  external_url: string;
  gnssNum: string;
  image: string;
  name: string;
}

export interface Mems {
  owner: string;
  url: string;
}
