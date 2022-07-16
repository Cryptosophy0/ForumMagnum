import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  text: {
    ...theme.typography.body2,
    ...theme.typography.postStyle
  }
});

export interface CoreReadingCollection {
  title: string,
  subtitle?: string,
  small?: boolean,
  id: string,
  userId: string,
  summary: string,
  imageId?: string,
  imageUrl?: string,
  color: string,
  big: boolean,
  url: string,
}

export const coreReadingCollections: Array<CoreReadingCollection> = 
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
        <p> For two years Eliezer Yudkowsky wrote a blogpost a day, braindumping thoughts on rationality, ambition and artificial intelligence. Those posts were edited into this introductory collection, recommended reading for all Lesswrong users.
        </p>
      </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657767459/mississippi-compass_gwqjvs.png",
      color: "#B1D4B4",
      big: true,
      url: '/rationality',
    },
    {
      title: "Sequence Highlights",
      // subtitle: "An overview of key rationality concepts",
      id: "dummyId4",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
        <p>LessWrong can be kind of intimidating - there's a lot of concepts to learn. We recommend getting started with the Highlights, a collection of 50 top posts from Eliezer's Sequences.</p>
        <p>A day or two read, covering the foundations of rationality.</p>
        </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces,w_auto,h_280/sequences/rdl8pwokejuqyxipg6vx",
      color: "#757AA7",
      big: false,
      url: "/highlights",
    },
    {
      title: "The Codex",
      // subtitle: "Collected writings of Scott Alexander",
      // small: true,
      id: "dummyId2",
      userId: "XgYW5s8njaYrtyP7q",
      summary: "<div>Essays by Scott Alexander. Explores science, medicine, philosophy, politics, and futurism. Also one post about hallucinatory cactus people.</div>",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657688283/codex_u7ptgt.png",
      color: "#88ACB8",
      big: false,
      url: "/codex",
    },
    {
      title: "Harry Potter and the Methods of Rationality",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      // subtitle: "Fiction by Eliezer Yudkowsky",
      summary: `<div>
        <p>What if Harry Potter was a scientist? What would you do if the universe had magic in it? <br/>A story that conveys many rationality concepts, making them more visceral and emotionally compelling.</div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657926268/DALL_E_2022-07-15_16.04.08_-_in_a_large_library_a_boy_stands_before_12_books_hovering_and_glowing_chinese_watercolor_by_Thomas_Schaler_and_da_Vinci_as_digital_art_mlmfw4.png",
      color: "#757AA7",
      big: false,
      url: "/hpmor",
    },
    {
      title: "Best of LessWrong",
      // subtitle: "Assorted authors",
      // small: true,
      id: "dummyId5",
      userId: "nmk3nLpQE89dMRzzN",
      // summary: "<div>Each year, the LessWrong community votes on which posts have stood the tests of time.</div>",
      summary: "<div>Each December, the LessWrong community reviews the best posts from the previous year, and votes on which of them have stood the tests of time.</div>",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657778273/DALL_E_2022-07-13_22.57.43_-_Books_and_emerald_compass_displayed_on_a_pedastal_aquarelle_painting_by_da_vinci_and_thomas_shaler_magic_the_gathering_concept_art_as_digital_art_ayufzo.png",
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

  const { results: collections } = useMulti({
    terms: {view:"allCollections"},
    collectionName: "Collections",
    fragmentName: 'CollectionsItemFragment',
  })

  return <SingleColumnSection className={classes.root}>
    {coreReadingCollections.map(collection => <CollectionsItem key={collection.id} collection={collection}/>)}
  </SingleColumnSection>
}

const LWCoreReadingComponent = registerComponent("LWCoreReading", LWCoreReading, {styles});

declare global {
  interface ComponentTypes {
    LWCoreReading: typeof LWCoreReadingComponent
  }
}

