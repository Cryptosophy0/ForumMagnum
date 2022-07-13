import React, { ReactChild } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  razLargeVersion: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  razSmallVersion: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
  },
});

export interface CoreReadingCollection {
  title: string,
  subtitle?: string,
  id: string,
  userId: string,
  summary: string,
  imageId?: string,
  imageUrl?: string,
  color: string,
  big: boolean,
  url: string,
}

const coreReadingCollections: Array<CoreReadingCollection> = 
  [
    {
      title: "Rationality: A-Z",
      subtitle: 'Also known as "The Sequences"',
      id: "dummyId",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
        <p>
          How can we think better on purpose? <em>Why</em> should we think better on purpose?
        </p>
        <p> For two years Eliezer Yudkowsky wrote a blogpost a day, braindumping thoughts on rationality, science, ambition and artificial intelligence. Those posts were edited into this introductory collection, recommended reading for all Lesswrong users.
        </p>
      </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657688357/mississippi-2_jelojk.png",
      color: "#B1D4B4",
      big: true,
      url: '/rationality',
    },
    {
      title: "Sequence Highlights",
      subtitle: "An overview of key LessWrong concepts",
      id: "dummyId4",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
          <p>The Sequences are... pretty long. They're well worth it, but if you're intimidated, we've collected 50 key posts into a short introduction you can read in a weekend.</p>
        </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces,w_auto,h_280/sequences/rdl8pwokejuqyxipg6vx",
      color: "#757AA7",
      big: false,
      url: "/highlights",
    },
    {
      title: "The Codex",
      subtitle: "Collected writings of Scott Alexander",
      id: "dummyId2",
      userId: "XgYW5s8njaYrtyP7q",
      summary: "<div>Essays which illustrate good thinking — exploring science, medicine, philosophy, politics, and futurism. (There’s also one post about hallucinatory cactus-people, but it’s not representative)</div>",
      // imageId: "ItFKgn4_rrr58y.png",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657688283/codex_u7ptgt.png",
      color: "#88ACB8",
      big: false,
      url: "/codex",
    },
    {
      title: "Harry Potter and the Methods of Rationality",
      subtitle: "Fiction by Eliezer Yudkowsky",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
        <p>What if Harry Potter was a scientist? What would you do if the universe had magic in it? <br/>A story that conveys many rationality concepts, making them more visceral and emotionally compelling.</div>`,
      // imageId: "uu4fJ5R_zeefim.png",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657690222/fingersnap_pq9akc.png",
      color: "#757AA7",
      big: false,
      url: "/hpmor",
    },
    {
      title: "Best of LessWrong",
      subtitle: "Assorted authors",
      id: "dummyId5",
      userId: "nmk3nLpQE89dMRzzN",
      // subtitle: "Collected best works of LessWrong",
      summary: "<div>Each December, the LessWrong community reviews the best posts from the previous year, and votes on which of them have stood the tests of time.</div>",
      // imageId: "uu4fJ5R_zeefim.png",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657701476/croppedl_aquarelle_painting_by_da_vinci_and_thomas_shaler_magic_the_gathering_concept_art_as_digital_art_i3r1es.jpg",
      color: "#757AA7",
      big: false,
      url: "/bestoflesswrong",
    }
  ]

const LWCoreReading = ({classes}: {
  minimal?: boolean,
  classes: ClassesType,
}) => {
  const { SingleColumnSection, CollectionsItem } = Components

  return <SingleColumnSection>
    {coreReadingCollections.map(collection => <CollectionsItem key={collection.id} collection={collection}/>)}
  </SingleColumnSection>
}

const LWCoreReadingComponent = registerComponent("LWCoreReading", LWCoreReading, {styles});

declare global {
  interface ComponentTypes {
    LWCoreReading: typeof LWCoreReadingComponent
  }
}
