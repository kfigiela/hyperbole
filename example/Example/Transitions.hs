module Example.Transitions where

import Effectful
import Example.Style as Style
import Web.Hyperbole


page :: (Hyperbole :> es) => Page es Response
page = do
  handle content

  load $ do
    pure $ row (pad 20) $ do
      hyper Contents viewSmall


data Contents = Contents
  deriving (Generic, Param)


data ContentsAction
  = Expand
  | Collapse
  deriving (Generic, Param)


instance HyperView Contents where
  type Action Contents = ContentsAction


content :: (Hyperbole :> es) => Contents -> ContentsAction -> Eff es (View Contents ())
content _ Expand = do
  pure viewBig
content _ Collapse = do
  pure viewSmall


viewSmall :: View Contents ()
viewSmall = do
  col (gap 10 . border 1 . pad 20 . transition 300 (Width 200)) $ do
    el id "Small"
    button Expand Style.btn "Expand"


viewBig :: View Contents ()
viewBig = col (gap 10 . border 1 . pad 20 . transition 300 (Width 400)) $ do
  el_ "Expanded"
  button Collapse Style.btn "Collapse"
